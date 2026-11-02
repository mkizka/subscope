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

  findAll(): Post[] {
    return Array.from(this.posts.values());
  }

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<Post | null> {
    return this.posts.get(uri.toString()) ?? null;
  }

  async save(params: { ctx: TransactionContext; post: Post }): Promise<void> {
    this.posts.set(params.post.uri.toString(), params.post);
  }
}
