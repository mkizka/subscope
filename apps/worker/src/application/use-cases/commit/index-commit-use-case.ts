import {
  type ILoggerManager,
  type ITransactionManager,
} from "@repo/common/interface";
import { RecordValidationError } from "@repo/common/utils";

import type { IndexRecordService } from "../../services/index-record-service.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

export class IndexCommitUseCase {
  private readonly logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly transactionManager: ITransactionManager,
    private readonly indexRecordService: IndexRecordService,
  ) {
    this.logger = loggerManager.createLogger("IndexCommitUseCase");
  }

  async execute(command: IndexCommitCommand) {
    try {
      await this.doIndexCommit(command);
    } catch (error) {
      if (error instanceof RecordValidationError) {
        this.logger.warn({ uri: command.commit.uri.toString() }, error.message);
        return;
      }
      throw error;
    }
  }

  private async doIndexCommit({ commit, live }: IndexCommitCommand) {
    await this.transactionManager.transaction(async (ctx) => {
      if (commit.operation === "delete") {
        // Related data is also deleted by cascade
        await this.indexRecordService.delete({ ctx, uri: commit.uri });
        return;
      }
      await this.indexRecordService.index({
        ctx,
        record: commit.record,
        origin: { type: live ? "tapLive" : "tapPast" },
        priority: live ? "high" : "low",
      });
    });
  }
}
