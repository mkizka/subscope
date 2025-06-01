import type { Record, TransactionContext } from "@dawn/common/domain";
import { Post } from "@dawn/common/domain";

import type { IIndexColectionService } from "../interfaces/index-collection-service.js";
import type { IPostRepository } from "../interfaces/post-repository.js";
import type { ISubscriptionRepository } from "../interfaces/subscription-repository.js";

export class IndexPostService implements IIndexColectionService {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["postRepository", "subscriptionRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const post = Post.from(record);

    const shouldSave = await this.shouldSavePost(ctx, post);
    if (!shouldSave) {
      return;
    }

    await this.postRepository.upsert({ ctx, post });
  }

  private async shouldSavePost(
    ctx: TransactionContext,
    post: Post,
  ): Promise<boolean> {
    // subscribers本人の投稿は保存
    if (await this.subscriptionRepository.isSubscriber(ctx, post.actorDid)) {
      return true;
    }

    // リプライの場合：リプライ先またはリプライルートの投稿がDB上にあれば保存
    if (post.replyParent || post.replyRoot) {
      const replyUris = new Set<string>();
      if (post.replyParent) {
        replyUris.add(post.replyParent.uri.toString());
      }
      if (post.replyRoot) {
        replyUris.add(post.replyRoot.uri.toString());
      }
      if (
        replyUris.size > 0 &&
        (await this.postRepository.existsAny(ctx, Array.from(replyUris)))
      ) {
        return true;
      }
    }

    // 通常投稿：投稿者のフォロワーが1人以上subscribersなら保存
    return await this.subscriptionRepository.hasSubscriberFollower(
      ctx,
      post.actorDid,
    );
  }
}
