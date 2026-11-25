import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import { feedItemFromPost } from "../../dto/feed-item.js";
import { postNotifications } from "../../dto/notification.js";
import {
  getEmbedRecordUri,
  parsePost,
  postStatsTargets,
} from "../../dto/post.js";
import type { Record } from "../../dto/record.js";
import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { NotificationService } from "../notification-service.js";
import type { PastRecordFilterService } from "../past-record-filter-service.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";
import type { StatsService } from "../stats-service.js";

const REPLY_NOTIFICATION_DEPTH = 4;

export class PostIndexer implements IRecordIndexer {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly postQuery: IPostQuery,
    private readonly pastRecordFilterService: PastRecordFilterService,
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
    const post = parsePost(record);
    const accepted = await this.pastRecordFilterService.accepts({
      ctx,
      origin,
      did: post.accountDid,
      createdAt: post.createdAt,
    });
    if (!accepted) {
      return;
    }

    await this.recordSaveService.save({ ctx, record, origin });
    await this.postRepository.save({ ctx, post });
    await this.feedItemRepository.save({
      ctx,
      feedItem: feedItemFromPost(post),
    });

    await this.notificationService.notify({
      ctx,
      origin,
      notifications: async () =>
        postNotifications(
          post,
          post.replyParent
            ? await this.postQuery.findReplyAncestorUris(
                ctx,
                post.replyParent.uri,
                REPLY_NOTIFICATION_DEPTH,
              )
            : [],
        ),
    });
    await this.relatedRecordService.request({
      ctx,
      origin,
      uri: getEmbedRecordUri(post),
    });
    this.statsService.recount({
      ctx,
      posts: [post.uri, ...postStatsTargets(post)],
      accounts: [post.accountDid],
    });
  }

  afterDelete({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const post = parsePost(record);
    this.statsService.recount({
      ctx,
      posts: postStatsTargets(post),
      accounts: [post.accountDid],
    });
  }
}
