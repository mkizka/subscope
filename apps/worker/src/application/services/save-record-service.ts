import type { TransactionContext } from "@repo/common/interface";

import { feedItemFromPost, feedItemFromRepost } from "../dto/feed-item.js";
import type { ParsedRecord } from "../dto/parsed-record.js";
import type { Record } from "../dto/record.js";
import type { IFeedItemRepository } from "../interfaces/repositories/feed-item-repository.js";
import type { IFollowRepository } from "../interfaces/repositories/follow-repository.js";
import type { IGeneratorRepository } from "../interfaces/repositories/generator-repository.js";
import type { ILikeRepository } from "../interfaces/repositories/like-repository.js";
import type { IListItemRepository } from "../interfaces/repositories/list-item-repository.js";
import type { IListRepository } from "../interfaces/repositories/list-repository.js";
import type { IPostRepository } from "../interfaces/repositories/post-repository.js";
import type { IProfileRepository } from "../interfaces/repositories/profile-repository.js";
import type { IRecordRepository } from "../interfaces/repositories/record-repository.js";
import type { IRepostRepository } from "../interfaces/repositories/repost-repository.js";
import type { IndexAccountService } from "./index-account-service.js";

export class SaveRecordService {
  constructor(
    private readonly indexAccountService: IndexAccountService,
    private readonly recordRepository: IRecordRepository,
    private readonly postRepository: IPostRepository,
    private readonly repostRepository: IRepostRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly likeRepository: ILikeRepository,
    private readonly followRepository: IFollowRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly generatorRepository: IGeneratorRepository,
    private readonly listRepository: IListRepository,
    private readonly listItemRepository: IListItemRepository,
  ) {}

  async save({
    ctx,
    record,
    parsed,
  }: {
    ctx: TransactionContext;
    record: Record;
    parsed: ParsedRecord;
  }) {
    await this.indexAccountService.upsert({ ctx, did: record.uri.did });
    await this.recordRepository.save({ ctx, record });
    await this.saveCollection(ctx, parsed);
  }

  private async saveCollection(ctx: TransactionContext, parsed: ParsedRecord) {
    switch (parsed.collection) {
      case "app.bsky.feed.post": {
        const { post } = parsed;
        await this.postRepository.save({ ctx, post });
        await this.feedItemRepository.save({
          ctx,
          feedItem: feedItemFromPost(post),
        });
        return;
      }
      case "app.bsky.feed.repost": {
        const { repost } = parsed;
        await this.repostRepository.save({ ctx, repost });
        await this.feedItemRepository.save({
          ctx,
          feedItem: feedItemFromRepost(repost),
        });
        return;
      }
      case "app.bsky.feed.like":
        await this.likeRepository.save({ ctx, like: parsed.like });
        return;
      case "app.bsky.graph.follow": {
        const { follow } = parsed;
        await this.indexAccountService.upsert({ ctx, did: follow.subjectDid });
        await this.followRepository.save({ ctx, follow });
        return;
      }
      case "app.bsky.graph.listitem": {
        const { listItem } = parsed;
        await this.indexAccountService.upsert({
          ctx,
          did: listItem.subjectDid,
        });
        await this.listItemRepository.save({ ctx, listItem });
        return;
      }
      case "app.bsky.actor.profile":
        await this.profileRepository.save({
          ctx,
          profile: parsed.profile,
        });
        return;
      case "app.bsky.feed.generator":
        await this.generatorRepository.save({
          ctx,
          generator: parsed.generator,
        });
        return;
      case "app.bsky.graph.list":
        await this.listRepository.save({ ctx, list: parsed.list });
        return;
      case "app.bsky.actor.link":
      case "app.bsky.feed.threadgate":
      case "app.bsky.feed.postgate":
        return;
    }
  }
}
