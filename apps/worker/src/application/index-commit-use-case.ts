import { type ITransactionManager, Record } from "@dawn/common/domain";

import type { IndexCommitCommand } from "./index-commit-command.js";
import type { IRecordRepository } from "./interfaces/record-repository.js";
import type { IndexActorService } from "./service/index-actor-service.js";
import type { IndexPostService } from "./service/index-post-service.js";
import type { IndexProfileService } from "./service/index-profile-service.js";

export class IndexCommitUseCase {
  private readonly services;

  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly recordRepository: IRecordRepository,
    private readonly indexActorService: IndexActorService,
    indexPostService: IndexPostService,
    indexProfileService: IndexProfileService,
  ) {
    this.services = {
      "app.bsky.feed.post": indexPostService,
      "app.bsky.actor.profile": indexProfileService,
    };
  }
  static inject = [
    "transactionManager",
    "recordRepository",
    "indexActorService",
    "indexPostService",
    "indexProfileService",
  ] as const;

  async execute(command: IndexCommitCommand) {
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexActorService.upsert({ ctx, did: command.did });
      const indexService = this.services[command.collection];
      switch (command.operation) {
        case "create":
        case "update": {
          const record = new Record({
            uri: command.uri,
            cid: command.cid,
            json: command.record,
          });
          await indexService.upsert({ ctx, record });
          await this.recordRepository.upsert({ ctx, record });
          break;
        }
        case "delete": {
          await indexService.delete({ ctx, uri: command.uri });
          await this.recordRepository.delete({ ctx, uri: command.uri });
          break;
        }
      }
    });
  }
}
