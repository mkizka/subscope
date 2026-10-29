import type { LexRouter } from "@atproto/lex-server";
import { AtUri } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";

import type { GetPostsUseCase } from "../../../../../application/use-cases/feed/get-posts-use-case.js";

export class GetPosts {
  constructor(private readonly getPostsUseCase: GetPostsUseCase) {}
  static inject = ["getPostsUseCase"] as const;

  handle(router: LexRouter) {
    router.add(getPosts, async ({ params }) => {
      const posts = await this.getPostsUseCase.execute(
        params.uris.map((uri) => new AtUri(uri)),
      );
      return {
        body: { posts },
      };
    });
  }
}
