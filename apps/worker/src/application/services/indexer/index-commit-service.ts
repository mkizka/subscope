import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import type { Record } from "@repo/common/domain";
import {
  isSupportedCollection,
  type SupportedCollection,
} from "@repo/common/utils";

import type { JobLogger } from "../../../shared/job.js";
import type { IRecordRepository } from "../../interfaces/repositories/record-repository.js";
import type { IIndexCollectionService } from "../../interfaces/services/index-collection-service.js";
import type { FollowIndexer } from "./follow-indexer.js";
import type { IndexActorService } from "./index-actor-service.js";
import type { IndexProfileService } from "./index-profile-service.js";
import type { IndexSubscriptionService } from "./index-subscription-service.js";
import type { LikeIndexer } from "./like-indexer.js";
import type { PostIndexer } from "./post-indexer.js";
import type { RepostIndexer } from "./repost-indexer.js";

type IndexCollectionServiceMap = {
  [key in SupportedCollection]: IIndexCollectionService;
};

const isValidRecord = (record: Record) => {
  // Postgresには`\u0000`を含む文字列を保存できないため
  return !JSON.stringify(record.json).includes("\\u0000");
};

export class IndexCommitService {
  private readonly services: IndexCollectionServiceMap;

  constructor(
    private readonly recordRepository: IRecordRepository,
    private readonly indexActorService: IndexActorService,
    postIndexer: PostIndexer,
    indexProfileService: IndexProfileService,
    followIndexer: FollowIndexer,
    likeIndexer: LikeIndexer,
    repostIndexer: RepostIndexer,
    indexSubscriptionService: IndexSubscriptionService,
  ) {
    this.services = {
      "app.bsky.feed.post": postIndexer,
      "app.bsky.feed.repost": repostIndexer,
      "app.bsky.actor.profile": indexProfileService,
      "app.bsky.graph.follow": followIndexer,
      "app.bsky.feed.like": likeIndexer,
      "dev.mkizka.test.subscription": indexSubscriptionService,
    };
  }
  static inject = [
    "recordRepository",
    "indexActorService",
    "postIndexer",
    "indexProfileService",
    "followIndexer",
    "likeIndexer",
    "repostIndexer",
    "indexSubscriptionService",
  ] as const;

  async upsert({
    ctx,
    record,
    jobLogger,
  }: {
    ctx: TransactionContext;
    record: Record;
    jobLogger: JobLogger;
  }): Promise<void> {
    if (!isSupportedCollection(record.collection)) {
      throw new Error(`Unsupported collection: ${record.collection}`);
    }
    if (!isValidRecord(record)) {
      await jobLogger.log("Invalid record: null character found");
      return;
    }
    const shouldSave = await this.services[record.collection].shouldSave({
      ctx,
      record,
    });
    if (!shouldSave) {
      await jobLogger.log("Record does not match storage rules, skipping");
      return;
    }
    await this.indexActorService.upsert({
      ctx,
      did: record.actorDid,
    });
    await this.recordRepository.upsert({ ctx, record });
    await this.services[record.collection].upsert({ ctx, record });
  }

  async delete({ ctx, uri }: { ctx: TransactionContext; uri: AtUri }) {
    await this.recordRepository.delete({ ctx, uri });
  }
}
