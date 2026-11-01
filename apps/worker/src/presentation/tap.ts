import { lexToJson } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import type { RecordEvent, TapEvent } from "@atproto/tap";
import { Tap } from "@atproto/tap";
import type { ILoggerManager, IMetricReporter } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { isSupportedCollection } from "@repo/common/utils";

import type { IndexCommitCommand } from "../application/use-cases/commit/index-commit-command.js";
import type { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import type { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
import type { JobLogger } from "../shared/job.js";

export const indexCommitCommandFactory = (
  event: RecordEvent,
  jobLogger: JobLogger,
): IndexCommitCommand | null => {
  const uri = AtUri.make(event.did, event.collection, event.rkey);
  if (event.action === "delete") {
    return {
      commit: { operation: event.action, uri, rev: event.rev },
      live: event.live,
      jobLogger,
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
      record: Record.create({
        uri,
        cid: event.cid,
        json: lexToJson(event.record),
      }),
    },
    live: event.live,
    jobLogger,
  };
};

export class TapSubscriber {
  private readonly logger;
  private readonly jobLogger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly metricReporter: IMetricReporter,
    private readonly indexCommitUseCase: IndexCommitUseCase,
    private readonly upsertIdentityUseCase: UpsertIdentityUseCase,
    private readonly tapUrl: string,
    private readonly tapConcurrency: number,
  ) {
    this.logger = loggerManager.createLogger("TapSubscriber");
    this.jobLogger = {
      log: (message: string) => {
        this.logger.debug(message);
        return Promise.resolve(0);
      },
    };
  }

  private async handleEvent(event: TapEvent) {
    if (event.type === "identity") {
      this.metricReporter.increment("worker_events_identity_total");
      await this.upsertIdentityUseCase.execute({
        did: event.did,
        handle: event.handle,
        status: event.status,
      });
      return;
    }
    if (!isSupportedCollection(event.collection)) return;
    const command = indexCommitCommandFactory(event, this.jobLogger);
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
    const inFlight = new Set<Promise<void>>();
    const channel = new Tap(this.tapUrl).channel(
      {
        onEvent: async (event, { ack }) => {
          if (inFlight.size >= this.tapConcurrency) {
            await Promise.race(inFlight);
          }
          const task = this.handleEvent(event)
            .then(ack)
            .catch((err: unknown) => {
              this.logger.error(
                { err, id: event.id },
                "Failed to process event",
              );
            })
            .finally(() => inFlight.delete(task));
          inFlight.add(task);
        },
        onError: (err) => this.logger.error({ err }, "Tap error occurred"),
      },
      { heartbeatIntervalMs: 60_000 },
    );
    this.logger.info(`Tap connection starting at ${this.tapUrl}`);
    await channel.start();
  }
}
