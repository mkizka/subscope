import type { AtUri } from "@atproto/syntax";
import type { AfterCommitContext } from "@repo/common/domain";
import type { Record } from "@repo/common/domain";
import {
  isSupportedCollection,
  type SupportedCollection,
} from "@repo/common/utils";

import type { IRecordRepository } from "../interfaces/repositories/record-repository.js";
import type { ICollectionIndexer } from "../interfaces/services/index-collection-service.js";
import type { IndexActorService } from "./index-actor-service.js";
import type { FollowIndexer } from "./indexer/follow-indexer.js";
import type { GateIndexer } from "./indexer/gate-indexer.js";
import type { GeneratorIndexer } from "./indexer/generator-indexer.js";
import type { LikeIndexer } from "./indexer/like-indexer.js";
import type { ListIndexer } from "./indexer/list-indexer.js";
import type { ListItemIndexer } from "./indexer/list-item-indexer.js";
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
    listIndexer: ListIndexer,
    listItemIndexer: ListItemIndexer,
    gateIndexer: GateIndexer,
  ) {
    this.indexers = {
      "app.bsky.feed.post": postIndexer,
      "app.bsky.feed.generator": generatorIndexer,
      "app.bsky.feed.repost": repostIndexer,
      "app.bsky.actor.profile": profileIndexer,
      "app.bsky.graph.follow": followIndexer,
      "app.bsky.feed.like": likeIndexer,
      "app.bsky.graph.list": listIndexer,
      "app.bsky.graph.listitem": listItemIndexer,
      "app.bsky.feed.threadgate": gateIndexer,
      "app.bsky.feed.postgate": gateIndexer,
    };
  }

  private indexerFor(record: Record) {
    if (!isSupportedCollection(record.collection)) {
      throw new Error(`Unsupported collection: ${record.collection}`);
    }
    return this.indexers[record.collection];
  }

  async shouldIndex({
    ctx,
    record,
  }: {
    ctx: AfterCommitContext;
    record: Record;
  }): Promise<boolean> {
    const indexer = this.indexerFor(record);
    if (!isValidRecord(record)) {
      return false;
    }
    return !indexer.shouldIndex || (await indexer.shouldIndex({ ctx, record }));
  }

  async upsert({
    ctx,
    record,
    live,
    depth,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    live: boolean;
    depth: number;
  }): Promise<void> {
    const indexer = this.indexerFor(record);
    await this.indexActorService.upsert({
      ctx,
      did: record.actorDid,
      live,
    });
    await this.recordRepository.upsert({ ctx, record });

    await indexer.upsert({ ctx, record, live, depth });
    await indexer.afterAction?.({ ctx, record, action: "upsert" });
  }

  async delete({ ctx, uri }: { ctx: AfterCommitContext; uri: AtUri }) {
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
