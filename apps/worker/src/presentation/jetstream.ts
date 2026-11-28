import { setTimeout as sleep } from "node:timers/promises";

import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { Jetstream, type RawEvent, type RawRecordJson } from "@bsky/jetstream";
import type { ILoggerManager, IMetricReporter } from "@repo/common/interface";
import {
  isSupportedCollection,
  SUPPORTED_COLLECTION_SCHEMAS,
} from "@repo/common/utils";

import type { ICursorStore } from "../application/interfaces/external/cursor-store.js";
import type { IndexCommitCommand } from "../application/use-cases/commit/index-commit-command.js";
import type { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import type { UpsertIdentityCommand } from "../application/use-cases/identity/upsert-identity-command.js";
import type { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
import type { RefreshAccountRosterUseCase } from "../application/use-cases/roster/refresh-account-roster-use-case.js";
import { isAccountStatus } from "../domain/account.js";
import type { AccountRoster, StreamEvent } from "../domain/account-roster.js";
import type { Env } from "../shared/env.js";

type JetstreamEvent = Exclude<RawEvent<RawRecordJson>, { kind: "sync" }>;

const ROSTER_REFRESH_INTERVAL_MS = 60_000;
const CURSOR_SAVE_INTERVAL_MS = 5_000;
const RECONNECT_DELAY_MS = 1_000;
const DID_PATTERN = /did:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]/g;

const toMicroseconds = (time: string) => new Date(time).getTime() * 1000;

const streamEventFactory = (event: JetstreamEvent): StreamEvent => {
  if (event.kind !== "commit") {
    return { kind: event.kind, authorDid: event.did };
  }
  const record =
    event.commit.operation === "delete" ? null : event.commit.record;
  return {
    kind: "commit",
    authorDid: event.did,
    operation: event.commit.operation,
    collection: event.commit.collection,
    containedDids: (JSON.stringify(record).match(DID_PATTERN) ?? []).map(
      (did) => asDid(did),
    ),
  };
};

const indexCommitCommandFactory = (
  event: Extract<JetstreamEvent, { kind: "commit" }>,
): IndexCommitCommand => {
  const { commit } = event;
  const uri = AtUri.make(event.did, commit.collection, commit.rkey);
  if (commit.operation === "delete") {
    return { commit: { operation: commit.operation, uri }, live: true };
  }
  return {
    commit: {
      operation: commit.operation,
      uri,
      record: {
        uri,
        cid: commit.cid,
        json: commit.record,
        indexedAt: new Date(),
      },
    },
    live: true,
  };
};

const upsertIdentityCommandFactory = (
  event: Extract<JetstreamEvent, { kind: "identity" | "account" }>,
): UpsertIdentityCommand => {
  if (event.kind === "identity") {
    return { did: event.did, handle: event.identity.handle };
  }
  const { active, status } = event.account;
  if (active) {
    return { did: event.did, status: "active" };
  }
  return {
    did: event.did,
    status: status && isAccountStatus(status) ? status : undefined,
  };
};

export class JetstreamSubscriber {
  private readonly logger;

  constructor(
    private readonly deps: {
      loggerManager: ILoggerManager;
      metricReporter: IMetricReporter;
      accountRoster: AccountRoster;
      refreshAccountRosterUseCase: RefreshAccountRosterUseCase;
      indexCommitUseCase: IndexCommitUseCase;
      upsertIdentityUseCase: UpsertIdentityUseCase;
      cursorStore: ICursorStore;
      env: Pick<Env, "JETSTREAM_URL">;
    },
  ) {
    this.logger = deps.loggerManager.createLogger("JetstreamSubscriber");
  }

  async start() {
    await this.deps.refreshAccountRosterUseCase.execute();
    setInterval(() => {
      this.deps.refreshAccountRosterUseCase.execute().catch((err: unknown) => {
        this.logger.error({ err }, "Failed to refresh account roster");
      });
    }, ROSTER_REFRESH_INTERVAL_MS).unref();
    this.logger.info(
      `Jetstream connection starting at ${this.deps.env.JETSTREAM_URL}`,
    );
    for (;;) {
      try {
        await this.subscribe();
      } catch (err) {
        this.logger.error({ err }, "Jetstream error occurred");
      }
      await sleep(RECONNECT_DELAY_MS);
    }
  }

  private async subscribe() {
    const url = this.deps.env.JETSTREAM_URL;
    const cursor = await this.deps.cursorStore.getCursor(url);
    const gap = { detected: false };
    let cursorSavedAt = 0;
    const events = new Jetstream(url).live({
      collections: Object.keys(SUPPORTED_COLLECTION_SCHEMAS).filter(
        isSupportedCollection,
      ),
      kinds: ["commit", "identity", "account"],
      cursor: {
        load: () => Promise.resolve(cursor),
        save: () => Promise.resolve(),
      },
      raw: true,
      onInfo: (info) => {
        gap.detected ||= info.name === "OutdatedCursor";
      },
    });
    for await (const event of events) {
      if (gap.detected && cursor !== undefined) {
        gap.detected = false;
        this.reportGap(cursor, event.time);
      }
      if (
        event.kind !== "sync" &&
        this.deps.accountRoster.passes(streamEventFactory(event))
      ) {
        await this.handle(event);
      }
      if (Date.now() - cursorSavedAt >= CURSOR_SAVE_INTERVAL_MS) {
        await this.deps.cursorStore.setCursor(url, toMicroseconds(event.time));
        cursorSavedAt = Date.now();
      }
    }
  }

  private async handle(event: JetstreamEvent) {
    if (event.kind === "commit") {
      this.deps.metricReporter.increment("worker_events_commit_total", {
        source: "jetstream",
        collection: event.commit.collection,
      });
      await this.deps.indexCommitUseCase.execute(
        indexCommitCommandFactory(event),
      );
    } else {
      this.deps.metricReporter.increment("worker_events_identity_total", {
        source: "jetstream",
      });
      await this.deps.upsertIdentityUseCase.execute(
        upsertIdentityCommandFactory(event),
      );
    }
  }

  private reportGap(cursor: number, resumedAt: string) {
    this.deps.metricReporter.increment("worker_jetstream_gap_total");
    this.logger.warn(
      { from: new Date(cursor / 1000).toISOString(), to: resumedAt },
      "Jetstream events were lost because the cursor is older than the lookback window",
    );
  }
}
