import { type ITransactionManager, Record } from "@dawn/common/domain";

import type { IndexCommitCommand } from "./index-commit-command.js";
import type { IndexCommitService } from "./service/index-commit-service.js";

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
          const record = Record.fromJson({
            uri: commit.uri,
            cid: commit.cid,
            json: commit.record,
          });
          await this.indexCommitService.upsert({ ctx, record, jobLogger });
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
