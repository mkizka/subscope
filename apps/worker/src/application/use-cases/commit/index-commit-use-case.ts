import type {
  AfterCommitContext,
  ILoggerManager,
  IMetricReporter,
  ITransactionManager,
} from "@repo/common/interface";
import {
  isSupportedCollection,
  RecordValidationError,
} from "@repo/common/utils";

import { Origin } from "../../../domain/origin.js";
import type { IRepoRevRepository } from "../../interfaces/repositories/repo-rev-repository.js";
import type { RecordIndexer } from "../../services/indexer/record-indexer.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

export class IndexCommitUseCase {
  private readonly logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly metricReporter: IMetricReporter,
    private readonly transactionManager: ITransactionManager,
    private readonly recordIndexer: RecordIndexer,
    private readonly repoRevRepository: IRepoRevRepository,
  ) {
    this.logger = loggerManager.createLogger("IndexCommitUseCase");
  }

  async execute(command: IndexCommitCommand) {
    const { uri, rev } = command.commit;
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexCommit(ctx, command);
      await this.repoRevRepository.save({ ctx, did: uri.did, rev });
    });
  }

  private async indexCommit(
    ctx: AfterCommitContext,
    { commit, live }: IndexCommitCommand,
  ) {
    const { collection } = commit.uri;
    if (!isSupportedCollection(collection)) return;
    this.metricReporter.increment("worker_events_commit_total", {
      collection,
    });
    if (commit.operation === "delete") {
      await this.recordIndexer.delete({ ctx, uri: commit.uri });
      return;
    }
    if (!commit.record) {
      this.logger.warn(
        { uri: commit.uri.toString() },
        "RecordEvent missing record or cid",
      );
      return;
    }
    try {
      await this.recordIndexer.index({
        ctx,
        record: commit.record,
        origin: live ? Origin.live() : Origin.backfill(),
      });
    } catch (error) {
      if (!(error instanceof RecordValidationError)) throw error;
      this.logger.warn({ uri: commit.uri.toString() }, error.message);
    }
  }
}
