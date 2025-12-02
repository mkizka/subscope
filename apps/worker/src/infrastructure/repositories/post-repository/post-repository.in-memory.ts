import type { AtUri } from "@atproto/syntax";
import type { Post, TransactionContext } from "@repo/common/domain";

import type { IPostRepository } from "../../../application/interfaces/repositories/post-repository.js";

export class InMemoryPostRepository implements IPostRepository {
  private posts: Map<string, Post> = new Map();

  add(post: Post): void {
    this.posts.set(post.uri.toString(), post);
  }

  clear(): void {
    this.posts.clear();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async upsert(params: { ctx: TransactionContext; post: Post }): Promise<void> {
    this.posts.set(params.post.uri.toString(), params.post);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async exists(ctx: TransactionContext, uri: AtUri): Promise<boolean> {
    return this.posts.has(uri.toString());
  }
}
