import { lexToJson } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import type {
  HandlerOpts,
  IdentityEvent,
  RecordEvent,
  TapEvent,
} from "@atproto/tap";
import { Tap } from "@atproto/tap";
import type { ILoggerManager, IMetricReporter } from "@repo/common/interface";

import type { IndexCommitCommand } from "../application/use-cases/commit/index-commit-command.js";
import type { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import type { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
import type { Env } from "../shared/env.js";

export const indexCommitCommandFactory = (
  event: RecordEvent,
): IndexCommitCommand => {
  const uri = AtUri.make(event.did, event.collection, event.rkey);
  if (event.action === "delete") {
    return {
      commit: { operation: event.action, uri, rev: event.rev },
      live: event.live,
    };
  }
  return {
    commit: {
      operation: event.action,
      uri,
      rev: event.rev,
      record:
        event.record === undefined || event.cid === undefined
          ? null
          : {
              uri,
              cid: event.cid,
              json: lexToJson(event.record),
              indexedAt: new Date(),
            },
    },
    live: event.live,
  };
};

export const MAX_IN_FLIGHT = 16;

export class TapSubscriber {
  private readonly logger;
  private readonly inFlight = new Set<Promise<void>>();

  constructor(
    private readonly deps: {
      loggerManager: ILoggerManager;
      metricReporter: IMetricReporter;
      indexCommitUseCase: IndexCommitUseCase;
      upsertIdentityUseCase: UpsertIdentityUseCase;
      env: Pick<Env, "TAP_URL">;
    },
  ) {
    this.logger = deps.loggerManager.createLogger("TapSubscriber");
  }

  private async handleRecordEvent(event: RecordEvent) {
    this.deps.metricReporter.increment("worker_events_commit_total", {
      source: "tap",
      collection: event.collection,
    });
    const indexed = await this.deps.indexCommitUseCase.execute(
      indexCommitCommandFactory(event),
    );
    if (indexed) {
      this.deps.metricReporter.increment("worker_records_indexed_total", {
        source: "tap",
        collection: event.collection,
        operation: event.action,
      });
    }
  }

  private async handleIdentityEvent(event: IdentityEvent) {
    this.deps.metricReporter.increment("worker_events_identity_total", {
      source: "tap",
    });
    await this.deps.upsertIdentityUseCase.execute({
      did: event.did,
      handle: event.handle,
      status: event.status,
    });
  }

  private async handleEvent(event: TapEvent, opts: HandlerOpts) {
    if (event.type === "record") {
      await this.handleRecordEvent(event);
    } else {
      await this.handleIdentityEvent(event);
    }
    await opts.ack();
  }

  private async onEvent(event: TapEvent, opts: HandlerOpts) {
    const task = this.handleEvent(event, opts)
      .catch((err: unknown) =>
        this.logger.error({ err, id: event.id }, "Failed to process Tap event"),
      )
      .finally(() => this.inFlight.delete(task));
    this.inFlight.add(task);
    if (this.inFlight.size >= MAX_IN_FLIGHT) {
      await Promise.race(this.inFlight);
    }
  }

  async start() {
    const channel = new Tap(this.deps.env.TAP_URL).channel(
      {
        onEvent: (event, opts) => this.onEvent(event, opts),
        onError: (err) => this.logger.error({ err }, "Tap error occurred"),
      },
      { heartbeatIntervalMs: 60_000 },
    );
    this.logger.info(`Tap connection starting at ${this.deps.env.TAP_URL}`);
    await channel.start();
  }
}
