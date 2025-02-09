import { AtUri } from "@atproto/syntax";
import type { Server } from "@dawn/client";

import type { FindPostsUseCase } from "../../../../../application/find-posts-use-case.js";

export class GetPosts {
  constructor(private readonly findPostsUseCase: FindPostsUseCase) {}
  static inject = ["findPostsUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getPosts({
      handler: async ({ params }) => {
        const posts = await this.findPostsUseCase.execute(
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
