import type { AtUri } from "@atproto/syntax";

import type { PostDto } from "../../application/dto/post-dto.js";
import type { IPostQuery } from "../../application/interfaces/post-query.js";

export class InMemoryPostQuery implements IPostQuery {
  private posts: Map<string, PostDto> = new Map();

  add(post: PostDto): void {
    this.posts.set(post.uri, post);
  }

  clear(): void {
    this.posts.clear();
  }

  findByUris(uris: AtUri[]): Promise<PostDto[]> {
    return Promise.resolve(
      uris.flatMap((uri) => this.posts.get(uri.toString()) ?? []),
    );
  }
}
