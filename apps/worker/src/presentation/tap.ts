import { lexToJson } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import type { IdentityEvent, RecordEvent } from "@atproto/tap";
import { SimpleIndexer, Tap } from "@atproto/tap";
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

export class TapSubscriber {
  private readonly logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly metricReporter: IMetricReporter,
    private readonly indexCommitUseCase: IndexCommitUseCase,
    private readonly upsertIdentityUseCase: UpsertIdentityUseCase,
    private readonly env: Pick<Env, "TAP_URL">,
  ) {
    this.logger = loggerManager.createLogger("TapSubscriber");
  }

  private async handleIdentityEvent(event: IdentityEvent) {
    this.metricReporter.increment("worker_events_identity_total");
    await this.upsertIdentityUseCase.execute({
      did: event.did,
      handle: event.handle,
      status: event.status,
    });
  }

  async start() {
    const indexer = new SimpleIndexer()
      .record((event) =>
        this.indexCommitUseCase.execute(indexCommitCommandFactory(event)),
      )
      .identity((event) => this.handleIdentityEvent(event))
      .error((err) => this.logger.error({ err }, "Tap error occurred"));
    const channel = new Tap(this.env.TAP_URL).channel(indexer, {
      heartbeatIntervalMs: 60_000,
    });
    this.logger.info(`Tap connection starting at ${this.env.TAP_URL}`);
    await channel.start();
  }
}
