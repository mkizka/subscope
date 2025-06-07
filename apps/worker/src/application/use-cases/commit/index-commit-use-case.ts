import { type ITransactionManager } from "@dawn/common/domain";

import type { IndexCommitService } from "../../services/indexer/index-commit-service.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

export class IndexCommitUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly indexCommitService: IndexCommitService,
  ) {}
  static inject = ["transactionManager", "indexCommitService"] as const;

  async execute({ commit, jobLogger }: IndexCommitCommand) {
    await jobLogger.log(commit.uri.toString());
    await this.transactionManager.transaction(async (ctx) => {
      switch (commit.operation) {
        case "create":
        case "update": {
          await this.indexCommitService.upsert({
            ctx,
            record: commit.record,
            jobLogger,
          });
          break;
        }
        case "delete": {
          // Related data is also deleted by cascade
          await this.indexCommitService.delete({ ctx, uri: commit.uri });
          break;
        }
      }
    });
  }
}
