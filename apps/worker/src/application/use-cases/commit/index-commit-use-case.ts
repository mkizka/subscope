import {
  type ITransactionManager,
  RecordValidationError,
} from "@repo/common/domain";

import type { IndexRecordService } from "../../services/index-record-service.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

export class IndexCommitUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly indexRecordService: IndexRecordService,
  ) {}
  static inject = ["transactionManager", "indexRecordService"] as const;

  async execute(command: IndexCommitCommand) {
    await command.jobLogger.log(
      `Starting indexing for commit: ${command.commit.uri.toString()}`,
    );
    try {
      await this.doIndexCommit(command);
      await command.jobLogger.log("Indexing completed successfully.");
    } catch (error) {
      if (error instanceof RecordValidationError) {
        await command.jobLogger.log(error.message);
        return;
      }
      throw error;
    }
  }

  async doIndexCommit({ commit, live, jobLogger }: IndexCommitCommand) {
    await this.transactionManager.transaction(async (ctx) => {
      switch (commit.operation) {
        case "create":
        case "update": {
          await this.indexRecordService.upsert({
            ctx,
            record: commit.record,
            jobLogger,
            indexingCtx: {
              depth: 0,
              live,
            },
          });
          break;
        }
        case "delete": {
          // Related data is also deleted by cascade
          await this.indexRecordService.delete({ ctx, uri: commit.uri });
          break;
        }
      }
    });
  }
}
