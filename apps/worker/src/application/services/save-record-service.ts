import type { TransactionContext } from "@repo/common/interface";
import { validateRecord } from "@repo/common/utils";

import { feedItemFromPost, feedItemFromRepost } from "../dto/feed-item.js";
import { parseFollow } from "../dto/follow.js";
import { parseGenerator } from "../dto/generator.js";
import { parseLike } from "../dto/like.js";
import { parseList } from "../dto/list.js";
import { parseListItem } from "../dto/list-item.js";
import { parsePost } from "../dto/post.js";
import { parseProfile } from "../dto/profile.js";
import type { Record } from "../dto/record.js";
import { parseRepost } from "../dto/repost.js";
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

  async save({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    await this.indexAccountService.upsert({ ctx, did: record.uri.did });
    await this.recordRepository.save({ ctx, record });
    await this.saveCollection(ctx, record);
  }

  private async saveCollection(ctx: TransactionContext, record: Record) {
    switch (record.uri.collection) {
      case "app.bsky.feed.post": {
        const post = parsePost(record);
        await this.postRepository.save({ ctx, post });
        await this.feedItemRepository.save({
          ctx,
          feedItem: feedItemFromPost(post),
        });
        return;
      }
      case "app.bsky.feed.repost": {
        const repost = parseRepost(record);
        await this.repostRepository.save({ ctx, repost });
        await this.feedItemRepository.save({
          ctx,
          feedItem: feedItemFromRepost(repost),
        });
        return;
      }
      case "app.bsky.feed.like":
        await this.likeRepository.save({ ctx, like: parseLike(record) });
        return;
      case "app.bsky.graph.follow": {
        const follow = parseFollow(record);
        await this.indexAccountService.upsert({ ctx, did: follow.subjectDid });
        await this.followRepository.save({ ctx, follow });
        return;
      }
      case "app.bsky.graph.listitem": {
        const listItem = parseListItem(record);
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
          profile: parseProfile(record),
        });
        return;
      case "app.bsky.feed.generator":
        await this.generatorRepository.save({
          ctx,
          generator: parseGenerator(record),
        });
        return;
      case "app.bsky.graph.list":
        await this.listRepository.save({ ctx, list: parseList(record) });
        return;
      case "app.bsky.actor.link":
        validateRecord("app.bsky.actor.link", record);
        return;
      case "app.bsky.feed.threadgate":
      case "app.bsky.feed.postgate":
        return;
      default:
        throw new Error(`Unsupported collection: ${record.uri.collection}`);
    }
  }
}
