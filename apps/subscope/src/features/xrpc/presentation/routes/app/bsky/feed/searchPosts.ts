import type { Server } from "@repo/client/server";

import type { SearchPostsUseCase } from "../../../../../application/use-cases/feed/search-posts-use-case.js";

export class SearchPosts {
  constructor(private searchPostsUseCase: SearchPostsUseCase) {}
  static inject = ["searchPostsUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.searchPosts({
      handler: async ({ params }) => {
        const result = await this.searchPostsUseCase.execute(params);

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
