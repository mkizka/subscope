import type { LexRouter } from "@atproto/lex-server";
import searchPostsV2 from "@repo/client/app/bsky/feed/searchPostsV2";

import type { SearchPostsUseCase } from "../../../../../application/use-cases/feed/search-posts-use-case.js";
import type { HandleMiddleware } from "../../../../middleware/handle-middleware.js";

export class SearchPostsV2 {
  constructor(
    private searchPostsUseCase: SearchPostsUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(searchPostsV2, async ({ params }) => {
      const authorDids = params.authors
        ? await this.handleMiddleware.resolveHandleOrDids(params.authors)
        : undefined;
      const result = await this.searchPostsUseCase.execute({
        q: params.query,
        authorDids,
        repliesOnly: params.repliesOnly,
        limit: params.limit,
        cursor: params.cursor,
      });

      return {
        body: result,
      };
    });
  }
}
