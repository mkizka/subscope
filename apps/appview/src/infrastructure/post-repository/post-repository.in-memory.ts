import type { AtUri } from "@atproto/syntax";
import type { Post } from "@repo/common/domain";

import type { IPostRepository } from "../../application/interfaces/post-repository.js";

export class InMemoryPostRepository implements IPostRepository {
  private posts: Map<string, Post> = new Map();

  add(post: Post): void {
    this.posts.set(post.uri.toString(), post);
  }

  clear(): void {
    this.posts.clear();
  }

  async findMany(params: { limit: number; cursor?: string }): Promise<Post[]> {
    let posts = Array.from(this.posts.values());

    posts = posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      posts = posts.filter((post) => post.createdAt < cursorDate);
    }

    return Promise.resolve(posts.slice(0, params.limit));
  }

  async findByUris(uris: AtUri[]): Promise<Post[]> {
    const uriStrings = uris.map((uri) => uri.toString());
    return Promise.resolve(
      Array.from(this.posts.values()).filter((post) =>
        uriStrings.includes(post.uri.toString()),
      ),
    );
  }

  async findByUri(uri: AtUri): Promise<Post | null> {
    return Promise.resolve(this.posts.get(uri.toString()) ?? null);
  }

  async findReplies(uri: AtUri, limit?: number): Promise<Post[]> {
    const uriStr = uri.toString();
    let replies = Array.from(this.posts.values()).filter(
      (post) => post.replyParent?.uri.toString() === uriStr,
    );

    replies = replies.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    if (limit !== undefined) {
      replies = replies.slice(0, limit);
    }

    return Promise.resolve(replies);
  }

  async search(params: {
    query: string;
    limit: number;
    cursor?: string;
  }): Promise<Post[]> {
    let posts = Array.from(this.posts.values()).filter(
      (post) =>
        post.text.toLowerCase().includes(params.query.toLowerCase()) &&
        post.replyParent === null,
    );

    posts = posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      posts = posts.filter((post) => post.createdAt < cursorDate);
    }

    return Promise.resolve(posts.slice(0, params.limit));
  }
}
