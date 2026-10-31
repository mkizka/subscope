import type { LexRouter } from "@atproto/lex-server";
import searchPostsV2 from "@repo/client/lex/app/bsky/feed/searchPostsV2";

import type { SearchPostsUseCase } from "../../../../../application/use-cases/feed/search-posts-use-case.js";

export class SearchPostsV2 {
  constructor(private searchPostsUseCase: SearchPostsUseCase) {}

  handle(router: LexRouter) {
    router.add(searchPostsV2, async ({ params }) => {
      const result = await this.searchPostsUseCase.execute({
        q: params.query ?? "",
        limit: params.limit,
        cursor: params.cursor,
      });

      return {
        body: result,
      };
    });
  }
}
