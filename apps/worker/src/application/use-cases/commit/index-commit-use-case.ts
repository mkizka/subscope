import type {
  AfterCommitContext,
  ILoggerManager,
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
    private readonly deps: {
      loggerManager: ILoggerManager;
      transactionManager: ITransactionManager;
      recordIndexer: RecordIndexer;
      repoRevRepository: IRepoRevRepository;
    },
  ) {
    this.logger = deps.loggerManager.createLogger("IndexCommitUseCase");
  }

  async execute(command: IndexCommitCommand) {
    const { uri, rev } = command.commit;
    return await this.deps.transactionManager.transaction(async (ctx) => {
      const indexed = await this.indexCommit(ctx, command);
      if (rev) {
        await this.deps.repoRevRepository.save({ ctx, did: uri.did, rev });
      }
      return indexed;
    });
  }

  private async indexCommit(
    ctx: AfterCommitContext,
    { commit, live }: IndexCommitCommand,
  ) {
    const { collection } = commit.uri;
    if (!isSupportedCollection(collection)) return false;
    if (commit.operation === "delete") {
      return await this.deps.recordIndexer.delete({ ctx, uri: commit.uri });
    }
    if (!commit.record) {
      this.logger.warn(
        { uri: commit.uri.toString() },
        "RecordEvent missing record or cid",
      );
      return false;
    }
    try {
      return await this.deps.recordIndexer.index({
        ctx,
        record: commit.record,
        origin: live ? Origin.live() : Origin.backfill(),
      });
    } catch (error) {
      if (!(error instanceof RecordValidationError)) throw error;
      this.logger.warn({ uri: commit.uri.toString() }, error.message);
      return false;
    }
  }
}
