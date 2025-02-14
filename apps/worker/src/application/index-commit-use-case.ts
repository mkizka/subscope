import { type ITransactionManager, Record } from "@dawn/common/domain";
import type { SupportedCollection } from "@dawn/common/utils";

import type { IndexCommitCommand } from "./index-commit-command.js";
import type { IIndexColectionService } from "./interfaces/index-collection-service.js";
import type { IRecordRepository } from "./interfaces/record-repository.js";
import type { FetchProfileService } from "./service/fetch-profile-service.js";
import type { IndexActorService } from "./service/index-actor-service.js";
import type { IndexPostService } from "./service/index-post-service.js";
import type { IndexProfileService } from "./service/index-profile-service.js";

type IndexCollectionServiceMap = {
  [key in SupportedCollection]: IIndexColectionService;
};

export class IndexCommitUseCase {
  private readonly services: IndexCollectionServiceMap;

  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly recordRepository: IRecordRepository,
    private readonly indexActorService: IndexActorService,
    private readonly fetchProfileService: FetchProfileService,
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
    "fetchProfileService",
    "indexPostService",
    "indexProfileService",
  ] as const;

  async execute(command: IndexCommitCommand) {
    await this.transactionManager.transaction(async (ctx) => {
      // 1. アクターがなければ作成
      await this.indexActorService.createIfNotExists({
        ctx,
        did: command.commit.did,
      });

      // 2. プロフィールがなければ作成
      await this.fetchProfileService.fetchAndCreateIfNotExists({
        ctx,
        did: command.commit.did,
      });

      // 3. コレクションごとにインデックス
      const indexService = this.services[command.commit.collection];
      switch (command.commit.operation) {
        case "create":
        case "update": {
          const record = new Record({
            uri: command.commit.uri,
            cid: command.commit.cid,
            json: command.commit.record,
          });
          await this.recordRepository.upsert({ ctx, record });
          await indexService.upsert({ ctx, record });
          break;
        }
        case "delete": {
          // Related data is also deleted by cascade
          await this.recordRepository.delete({ ctx, uri: command.commit.uri });
          break;
        }
      }
    });
  }
}
