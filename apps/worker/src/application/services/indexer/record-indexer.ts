import type { AtUri } from "@atproto/syntax";
import type { AfterCommitContext } from "@repo/common/interface";
import {
  isSupportedCollection,
  type SupportedCollection,
} from "@repo/common/utils";

import type { Origin } from "../../../domain/origin.js";
import { hasNullCharacter, type Record } from "../../../domain/record.js";
import type { IRecordRepository } from "../../interfaces/repositories/record-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { FollowIndexer } from "./follow-indexer.js";
import type { GateIndexer } from "./gate-indexer.js";
import type { GeneratorIndexer } from "./generator-indexer.js";
import type { LikeIndexer } from "./like-indexer.js";
import type { LinkIndexer } from "./link-indexer.js";
import type { ListIndexer } from "./list-indexer.js";
import type { ListItemIndexer } from "./list-item-indexer.js";
import type { PostIndexer } from "./post-indexer.js";
import type { ProfileIndexer } from "./profile-indexer.js";
import type { RepostIndexer } from "./repost-indexer.js";

export class RecordIndexer {
  private readonly indexers: { [key in SupportedCollection]: IRecordIndexer };

  constructor(
    private readonly deps: {
      recordRepository: IRecordRepository;
      postIndexer: PostIndexer;
      profileIndexer: ProfileIndexer;
      followIndexer: FollowIndexer;
      generatorIndexer: GeneratorIndexer;
      likeIndexer: LikeIndexer;
      repostIndexer: RepostIndexer;
      listIndexer: ListIndexer;
      listItemIndexer: ListItemIndexer;
      gateIndexer: GateIndexer;
      linkIndexer: LinkIndexer;
    },
  ) {
    this.indexers = {
      "app.bsky.feed.post": deps.postIndexer,
      "app.bsky.feed.generator": deps.generatorIndexer,
      "app.bsky.feed.repost": deps.repostIndexer,
      "app.bsky.actor.profile": deps.profileIndexer,
      "app.bsky.actor.link": deps.linkIndexer,
      "app.bsky.graph.follow": deps.followIndexer,
      "app.bsky.feed.like": deps.likeIndexer,
      "app.bsky.graph.list": deps.listIndexer,
      "app.bsky.graph.listitem": deps.listItemIndexer,
      "app.bsky.feed.threadgate": deps.gateIndexer,
      "app.bsky.feed.postgate": deps.gateIndexer,
    };
  }

  async index({
    ctx,
    record,
    origin,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
  }) {
    const { collection } = record.uri;
    if (!isSupportedCollection(collection)) {
      throw new Error(`Unsupported collection: ${collection}`);
    }
    if (hasNullCharacter(record)) {
      return false;
    }
    return await this.indexers[collection].index({ ctx, record, origin });
  }

  async delete({ ctx, uri }: { ctx: AfterCommitContext; uri: AtUri }) {
    const record = await this.deps.recordRepository.find({ ctx, uri });
    if (!record) {
      return false;
    }
    await this.deps.recordRepository.delete({ ctx, uri });
    if (isSupportedCollection(uri.collection)) {
      await this.indexers[uri.collection].afterDelete?.({ ctx, record });
    }
    return true;
  }
}
