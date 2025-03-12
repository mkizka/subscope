import { type ITransactionManager } from "@dawn/common/domain";

import type { IndexCommitCommand } from "./index-commit-command.js";
import type { IndexActorService } from "./service/index-actor-service.js";
import type { IndexCommitService } from "./service/index-commit-service.js";

export class IndexCommitUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly indexCommitService: IndexCommitService,
    private readonly indexActorService: IndexActorService,
  ) {}
  static inject = [
    "transactionManager",
    "indexCommitService",
    "indexActorService",
  ] as const;

  async execute({ commit, jobLogger }: IndexCommitCommand) {
    await jobLogger.log(commit.uri.toString());
    await this.transactionManager.transaction(async (ctx) => {
      switch (commit.operation) {
        case "create":
        case "update": {
          await this.indexActorService.createIfNotExists({
            ctx,
            did: commit.record.actorDid,
          });
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
