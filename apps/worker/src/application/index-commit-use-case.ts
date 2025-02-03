import { type ITransactionManager, Record } from "@dawn/common/domain";

import type { IndexCommitCommand } from "./index-commit-command.js";
import type { IRecordRepository } from "./interfaces/record-repository.js";
import type { IndexPostService } from "./post/index-post-service.js";
import type { IndexProfileService } from "./profile/index-profile-service.js";

export class IndexCommitUseCase {
  private readonly services;

  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly recordRepository: IRecordRepository,
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
    "indexPostService",
    "indexProfileService",
  ] as const;

  async execute(command: IndexCommitCommand) {
    await this.transactionManager.transaction(async (ctx) => {
      const service = this.services[command.collection];
      if (command.operation === "delete") {
        await this.recordRepository.delete({ ctx, uri: command.uri });
        await service.delete({ ctx, uri: command.uri });
      } else {
        const record = new Record({
          uri: command.uri,
          cid: command.cid,
          json: command.record,
        });
        await this.recordRepository.createOrUpdate({ ctx, record });
        await service.upsert({ ctx, record });
      }
    });
  }
}
