import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import { Post } from "../../../domain/post.js";
import type { Record } from "../../../domain/record.js";
import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { NotificationService } from "../notification-service.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";
import type { StatsService } from "../stats-service.js";

export class PostIndexer implements IRecordIndexer {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly postQuery: IPostQuery,
    private readonly storagePolicy: StoragePolicy,
    private readonly recordSaveService: RecordSaveService,
    private readonly notificationService: NotificationService,
    private readonly relatedRecordService: RelatedRecordService,
    private readonly statsService: StatsService,
  ) {}

  async index({
    ctx,
    record,
    origin,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
  }) {
    const post = Post.fromRecord(record);
    const saves = await this.storagePolicy.savesFeedRecord({
      ctx,
      origin,
      record: post,
    });
    if (!saves) {
      return;
    }

    await this.recordSaveService.save({ ctx, record, origin });
    await this.postRepository.save({ ctx, post });
    await this.feedItemRepository.save({ ctx, feedItem: post.feedItem });

    await this.notificationService.notify({
      ctx,
      origin,
      notifications: async () =>
        post.notifications(
          post.replyParent
            ? await this.postQuery.findReplyAncestorUris(
                ctx,
                post.replyParent.uri,
                Post.replyNotificationDepth,
              )
            : [],
        ),
    });
    await this.relatedRecordService.request({
      ctx,
      origin,
      uri: post.fetchableEmbedUri,
    });
    this.statsService.recount({
      ctx,
      posts: [post.uri, ...post.statsTargets],
      accounts: [post.accountDid],
    });
  }

  afterDelete({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const post = Post.fromRecord(record);
    this.statsService.recount({
      ctx,
      posts: post.statsTargets,
      accounts: [post.accountDid],
    });
  }
}
