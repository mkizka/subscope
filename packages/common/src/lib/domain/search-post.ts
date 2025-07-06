import type { AtUri } from "@atproto/syntax";

import type { Post } from "./post/post.js";

export class SearchPost {
  private constructor(
    public readonly uri: AtUri,
    public readonly text: string,
  ) {}

  static from(post: Post): SearchPost {
    return new SearchPost(post.uri, post.text);
  }
}
