import type { LexRouter } from "@atproto/lex-server";
import searchPosts from "@repo/client/app/bsky/feed/searchPosts";

import type { SearchPostsUseCase } from "../../../../../application/use-cases/feed/search-posts-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

export class SearchPosts {
  constructor(
    private searchPostsUseCase: SearchPostsUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(searchPosts, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const result = await this.searchPostsUseCase.execute(params, {
          viewerDid,
        });
        return { body: result };
      },
    });
  }
}
