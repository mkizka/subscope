import type { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";
import {
  isSupportedCollection,
  type SupportedCollection,
} from "@repo/common/utils";

import type { Record } from "../dto/record.js";
import type { IPostQuery } from "../interfaces/queries/post-query.js";
import type { IRecordRepository } from "../interfaces/repositories/record-repository.js";
import type {
  ICollectionIndexer,
  Indexing,
} from "../interfaces/services/index-collection-service.js";
import type { IndexAccountService } from "./index-account-service.js";
import type { FollowIndexer } from "./indexer/follow-indexer.js";
import type { GateIndexer } from "./indexer/gate-indexer.js";
import type { GeneratorIndexer } from "./indexer/generator-indexer.js";
import type { LikeIndexer } from "./indexer/like-indexer.js";
import type { LinkIndexer } from "./indexer/link-indexer.js";
import type { ListIndexer } from "./indexer/list-indexer.js";
import type { ListItemIndexer } from "./indexer/list-item-indexer.js";
import type { PostIndexer } from "./indexer/post-indexer.js";
import type { ProfileIndexer } from "./indexer/profile-indexer.js";
import type { RepostIndexer } from "./indexer/repost-indexer.js";

type CollectionIndexerMap = {
  [key in SupportedCollection]: ICollectionIndexer;
};

const MAX_FETCH_DEPTH = 2;

const isValidRecord = (record: Record) => {
  // Postgresには`\u0000`を含む文字列を保存できないため
  return !JSON.stringify(record.json).includes("\\u0000");
};

export class IndexRecordService {
  private readonly indexers: CollectionIndexerMap;

  constructor(
    private readonly recordRepository: IRecordRepository,
    private readonly indexAccountService: IndexAccountService,
    private readonly postQuery: IPostQuery,
    private readonly jobScheduler: IJobScheduler,
    postIndexer: PostIndexer,
    profileIndexer: ProfileIndexer,
    followIndexer: FollowIndexer,
    generatorIndexer: GeneratorIndexer,
    likeIndexer: LikeIndexer,
    repostIndexer: RepostIndexer,
    listIndexer: ListIndexer,
    listItemIndexer: ListItemIndexer,
    gateIndexer: GateIndexer,
    linkIndexer: LinkIndexer,
  ) {
    this.indexers = {
      "app.bsky.feed.post": postIndexer,
      "app.bsky.feed.generator": generatorIndexer,
      "app.bsky.feed.repost": repostIndexer,
      "app.bsky.actor.profile": profileIndexer,
      "app.bsky.actor.link": linkIndexer,
      "app.bsky.graph.follow": followIndexer,
      "app.bsky.feed.like": likeIndexer,
      "app.bsky.graph.list": listIndexer,
      "app.bsky.graph.listitem": listItemIndexer,
      "app.bsky.feed.threadgate": gateIndexer,
      "app.bsky.feed.postgate": gateIndexer,
    };
  }

  private indexerFor(record: Record) {
    if (!isSupportedCollection(record.uri.collection)) {
      throw new Error(`Unsupported collection: ${record.uri.collection}`);
    }
    return this.indexers[record.uri.collection];
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
    await this.indexAccountService.upsert({
      ctx,
      did: record.uri.did,
      live,
    });
    await this.recordRepository.save({ ctx, record });

    const indexing: Indexing = {
      live,
      depth,
      requestFetch: (uri) => this.requestFetch({ ctx, uri, live, depth }),
    };
    await indexer.upsert({ ctx, record, indexing });
    await indexer.afterAction?.({ ctx, record, action: "upsert" });
  }

  private async requestFetch({
    ctx,
    uri,
    live,
    depth,
  }: {
    ctx: AfterCommitContext;
    uri: AtUri;
    live: boolean;
    depth: number;
  }) {
    if (depth >= MAX_FETCH_DEPTH) {
      return;
    }
    const exists = await this.postQuery.exists(ctx, uri);
    if (exists) {
      return;
    }
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleFetchRecord(uri, { live, depth }),
    );
  }

  async delete({ ctx, uri }: { ctx: AfterCommitContext; uri: AtUri }) {
    const existingRecord = await this.recordRepository.find({ ctx, uri });

    await this.recordRepository.delete({ ctx, uri });

    if (
      existingRecord &&
      isSupportedCollection(existingRecord.uri.collection)
    ) {
      const indexer = this.indexers[existingRecord.uri.collection];
      await indexer.afterAction?.({
        ctx,
        record: existingRecord,
        action: "delete",
      });
    }
  }
}
