import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import { Post } from "../../../domain/post.js";
import type { Record } from "../../../domain/record.js";
import type { GatePolicy } from "../../../domain/services/gate-policy.js";
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
    private readonly deps: {
      postRepository: IPostRepository;
      feedItemRepository: IFeedItemRepository;
      postQuery: IPostQuery;
      storagePolicy: StoragePolicy;
      gatePolicy: GatePolicy;
      recordSaveService: RecordSaveService;
      notificationService: NotificationService;
      relatedRecordService: RelatedRecordService;
      statsService: StatsService;
    },
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
    const saves = await this.deps.storagePolicy.saves({
      ctx,
      origin,
      record: post,
    });
    if (!saves) {
      return false;
    }

    const violatesEmbeddingRules =
      await this.deps.gatePolicy.violatesEmbeddingRules({ ctx, origin, post });
    if (violatesEmbeddingRules) {
      post.markEmbeddingRulesViolated();
    }
    const violatesThreadgate = await this.deps.gatePolicy.violatesThreadgate({
      ctx,
      origin,
      post,
    });
    if (violatesThreadgate) {
      post.markThreadgateViolated();
    }

    await this.deps.recordSaveService.save({ ctx, record });
    await this.deps.relatedRecordService.requestFor({
      ctx,
      origin,
      record: post,
    });
    await this.deps.postRepository.save({ ctx, post });
    await this.deps.feedItemRepository.save({ ctx, feedItem: post.feedItem });

    await this.deps.notificationService.notify({
      ctx,
      origin,
      notifications: async () =>
        post.notifications(
          post.replyParent
            ? await this.deps.postQuery.findReplyAncestorUris({
                ctx,
                parentUri: post.replyParent.uri,
                limit: Post.replyNotificationDepth,
              })
            : [],
        ),
    });
    this.deps.statsService.recount({
      ctx,
      posts: [post.uri, ...post.statsTargets],
      accounts: [post.accountDid],
    });
    return true;
  }

  afterDelete({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const post = Post.fromRecord(record);
    this.deps.statsService.recount({
      ctx,
      posts: post.statsTargets,
      accounts: [post.accountDid],
    });
  }
}
