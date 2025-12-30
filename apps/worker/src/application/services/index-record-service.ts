import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import type { Record } from "@repo/common/domain";
import {
  isSupportedCollection,
  type SupportedCollection,
} from "@repo/common/utils";

import type { JobLogger } from "../../shared/job.js";
import type { IRecordRepository } from "../interfaces/repositories/record-repository.js";
import type {
  ICollectionIndexer,
  IndexingContext,
} from "../interfaces/services/index-collection-service.js";
import type { IndexActorService } from "./index-actor-service.js";
import type { FollowIndexer } from "./indexer/follow-indexer.js";
import type { GeneratorIndexer } from "./indexer/generator-indexer.js";
import type { LikeIndexer } from "./indexer/like-indexer.js";
import type { PostIndexer } from "./indexer/post-indexer.js";
import type { ProfileIndexer } from "./indexer/profile-indexer.js";
import type { RepostIndexer } from "./indexer/repost-indexer.js";

type CollectionIndexerMap = {
  [key in SupportedCollection]: ICollectionIndexer;
};

const isValidRecord = (record: Record) => {
  // Postgresには`\u0000`を含む文字列を保存できないため
  return !JSON.stringify(record.json).includes("\\u0000");
};

export class IndexRecordService {
  private readonly indexers: CollectionIndexerMap;

  constructor(
    private readonly recordRepository: IRecordRepository,
    private readonly indexActorService: IndexActorService,
    postIndexer: PostIndexer,
    profileIndexer: ProfileIndexer,
    followIndexer: FollowIndexer,
    generatorIndexer: GeneratorIndexer,
    likeIndexer: LikeIndexer,
    repostIndexer: RepostIndexer,
  ) {
    this.indexers = {
      "app.bsky.feed.post": postIndexer,
      "app.bsky.feed.generator": generatorIndexer,
      "app.bsky.feed.repost": repostIndexer,
      "app.bsky.actor.profile": profileIndexer,
      "app.bsky.graph.follow": followIndexer,
      "app.bsky.feed.like": likeIndexer,
    };
  }
  static inject = [
    "recordRepository",
    "indexActorService",
    "postIndexer",
    "profileIndexer",
    "followIndexer",
    "generatorIndexer",
    "likeIndexer",
    "repostIndexer",
  ] as const;

  async upsert({
    ctx,
    record,
    jobLogger,
    indexingCtx,
  }: {
    ctx: TransactionContext;
    record: Record;
    jobLogger: JobLogger;
    force?: boolean;
    indexingCtx: IndexingContext;
  }): Promise<void> {
    if (!isSupportedCollection(record.collection)) {
      throw new Error(`Unsupported collection: ${record.collection}`);
    }
    if (!isValidRecord(record)) {
      await jobLogger.log("Invalid record: null character found");
      return;
    }

    const indexer = this.indexers[record.collection];
    await this.indexActorService.upsert({
      ctx,
      did: record.actorDid,
      indexingCtx,
    });
    await this.recordRepository.upsert({ ctx, record });

    await indexer.upsert({ ctx, record, indexingCtx });
    await indexer.afterAction?.({ ctx, record, action: "upsert" });
  }

  async delete({ ctx, uri }: { ctx: TransactionContext; uri: AtUri }) {
    const existingRecord = await this.recordRepository.findByUri({ ctx, uri });

    await this.recordRepository.delete({ ctx, uri });

    if (existingRecord && isSupportedCollection(existingRecord.collection)) {
      const indexer = this.indexers[existingRecord.collection];
      await indexer.afterAction?.({
        ctx,
        record: existingRecord,
        action: "delete",
      });
    }
  }
}
