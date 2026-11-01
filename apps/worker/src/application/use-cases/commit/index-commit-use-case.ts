import {
  type ILoggerManager,
  type ITransactionManager,
  RecordValidationError,
} from "@repo/common/domain";

import type { IRecordRevRepository } from "../../interfaces/repositories/record-rev-repository.js";
import type { IndexRecordService } from "../../services/index-record-service.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

export class IndexCommitUseCase {
  private readonly logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly transactionManager: ITransactionManager,
    private readonly indexRecordService: IndexRecordService,
    private readonly recordRevRepository: IRecordRevRepository,
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

  async doIndexCommit({ commit, live }: IndexCommitCommand) {
    await this.transactionManager.transaction(async (ctx) => {
      if (
        commit.operation !== "delete" &&
        !(await this.indexRecordService.shouldIndex({
          ctx,
          record: commit.record,
        }))
      ) {
        return;
      }
      const isNotOlder = await this.recordRevRepository.saveIfNotOlder({
        ctx,
        uri: commit.uri,
        rev: commit.rev,
      });
      if (!isNotOlder) {
        return;
      }
      switch (commit.operation) {
        case "create":
        case "update": {
          await this.indexRecordService.upsert({
            ctx,
            record: commit.record,
            live,
            depth: 0,
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
