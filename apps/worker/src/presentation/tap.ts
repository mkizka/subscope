import { lexToJson } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import type { IdentityEvent, RecordEvent } from "@atproto/tap";
import { SimpleIndexer, Tap } from "@atproto/tap";
import type { ILoggerManager, IMetricReporter } from "@repo/common/interface";
import { isSupportedCollection } from "@repo/common/utils";

import type { IndexCommitCommand } from "../application/use-cases/commit/index-commit-command.js";
import type { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import type { UpdateRepoRevUseCase } from "../application/use-cases/commit/update-repo-rev-use-case.js";
import type { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
import type { Env } from "../shared/env.js";

export const indexCommitCommandFactory = (
  event: RecordEvent,
): IndexCommitCommand | null => {
  const uri = AtUri.make(event.did, event.collection, event.rkey);
  if (event.action === "delete") {
    return {
      commit: { operation: event.action, uri, rev: event.rev },
      live: event.live,
    };
  }
  if (event.record === undefined || event.cid === undefined) {
    return null;
  }
  return {
    commit: {
      operation: event.action,
      uri,
      rev: event.rev,
      record: {
        uri,
        cid: event.cid,
        json: lexToJson(event.record),
        indexedAt: new Date(),
      },
    },
    live: event.live,
  };
};

export class TapSubscriber {
  private readonly logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly metricReporter: IMetricReporter,
    private readonly indexCommitUseCase: IndexCommitUseCase,
    private readonly updateRepoRevUseCase: UpdateRepoRevUseCase,
    private readonly upsertIdentityUseCase: UpsertIdentityUseCase,
    private readonly env: Pick<Env, "TAP_URL">,
  ) {
    this.logger = loggerManager.createLogger("TapSubscriber");
  }

  private async handleRecordEvent(event: RecordEvent) {
    await this.indexRecordEvent(event);
    await this.updateRepoRevUseCase.execute({ did: event.did, rev: event.rev });
  }

  private async handleIdentityEvent(event: IdentityEvent) {
    this.metricReporter.increment("worker_events_identity_total");
    await this.upsertIdentityUseCase.execute({
      did: event.did,
      handle: event.handle,
      status: event.status,
    });
  }

  private async indexRecordEvent(event: RecordEvent) {
    if (!isSupportedCollection(event.collection)) return;
    const command = indexCommitCommandFactory(event);
    if (!command) {
      this.logger.warn({ event }, "RecordEvent missing record or cid");
      return;
    }
    this.metricReporter.increment("worker_events_commit_total", {
      collection: event.collection,
    });
    await this.indexCommitUseCase.execute(command);
  }

  async start() {
    const indexer = new SimpleIndexer()
      .record((event) => this.handleRecordEvent(event))
      .identity((event) => this.handleIdentityEvent(event))
      .error((err) => this.logger.error({ err }, "Tap error occurred"));
    const channel = new Tap(this.env.TAP_URL).channel(indexer, {
      heartbeatIntervalMs: 60_000,
    });
    this.logger.info(`Tap connection starting at ${this.env.TAP_URL}`);
    await channel.start();
  }
}
