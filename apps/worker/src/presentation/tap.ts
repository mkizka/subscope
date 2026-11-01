import { asDid } from "@atproto/did";
import { lexToJson } from "@atproto/lex";
import type { RecordEvent, TapEvent } from "@atproto/tap";
import { Tap } from "@atproto/tap";
import type {
  CommitEventDto,
  ILoggerManager,
  IMetricReporter,
} from "@repo/common/domain";
import { isSupportedCollection } from "@repo/common/utils";

import { indexCommitCommandFactory } from "../application/use-cases/commit/index-commit-command.js";
import type { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import type { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";

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

  private toCommitEvent(event: RecordEvent): CommitEventDto | null {
    if (!isSupportedCollection(event.collection)) {
      return null;
    }
    const base = {
      did: asDid(event.did),
      live: event.live,
      commit: {
        collection: event.collection,
        rkey: event.rkey,
        rev: event.rev,
      },
    };
    if (event.action === "delete") {
      return { ...base, commit: { ...base.commit, operation: "delete" } };
    }
    if (event.record === undefined || event.cid === undefined) {
      this.logger.warn({ event }, "RecordEvent missing record or cid");
      return null;
    }
    return {
      ...base,
      commit: {
        ...base.commit,
        operation: event.action,
        record: lexToJson(event.record),
        cid: event.cid,
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
    const commitEvent = this.toCommitEvent(event);
    if (!commitEvent) return;
    this.metricReporter.increment("worker_events_commit_total", {
      collection: commitEvent.commit.collection,
    });
    await this.indexCommitUseCase.execute(
      indexCommitCommandFactory({
        event: commitEvent,
        jobLogger: this.jobLogger,
      }),
    );
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
