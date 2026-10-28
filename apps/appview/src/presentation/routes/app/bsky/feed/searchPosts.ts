import type { LexRouter } from "@atproto/lex-server";
import searchPosts from "@repo/client/lex/app/bsky/feed/searchPosts";

import type { SearchPostsUseCase } from "../../../../../application/use-cases/feed/search-posts-use-case.js";

export class SearchPosts {
  constructor(private searchPostsUseCase: SearchPostsUseCase) {}
  static inject = ["searchPostsUseCase"] as const;

  handle(router: LexRouter) {
    router.add(searchPosts, async ({ params }) => {
      const result = await this.searchPostsUseCase.execute(params);

      return {
        body: result,
      };
    });
  }
}
