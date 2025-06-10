import { AtUri } from "@atproto/syntax";
import type { Server } from "@repo/client/server";

import type { GetPostsUseCase } from "../../../../../application/get-posts-use-case.js";

export class GetPosts {
  constructor(private readonly getPostsUseCase: GetPostsUseCase) {}
  static inject = ["getPostsUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getPosts({
      handler: async ({ params }) => {
        const posts = await this.getPostsUseCase.execute(
          params.uris.map((uri) => new AtUri(uri)),
        );
        return {
          encoding: "application/json",
          body: { posts },
        };
      },
    });
  }
}
