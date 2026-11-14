import type { LexRouter } from "@atproto/lex-server";
import searchPostsV2 from "@repo/client/app/bsky/feed/searchPostsV2";

import type { SearchPostsUseCase } from "../../../../../application/use-cases/feed/search-posts-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../middleware/handle-middleware.js";

export class SearchPostsV2 {
  constructor(
    private searchPostsUseCase: SearchPostsUseCase,
    private handleMiddleware: HandleMiddleware,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(searchPostsV2, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const words = params.query?.split(/\s+/).filter(Boolean) ?? [];
        const fromMe = words.includes("from:me");
        if (fromMe && !viewerDid) {
          return { body: { posts: [] } };
        }
        const authorDids = [
          ...(params.authors
            ? await this.handleMiddleware.resolveHandleOrDids(params.authors)
            : []),
          ...(fromMe && viewerDid ? [viewerDid] : []),
        ];
        const result = await this.searchPostsUseCase.execute(
          {
            q: words.filter((word) => word !== "from:me").join(" "),
            authorDids: authorDids.length ? authorDids : undefined,
            replies: params.repliesOnly
              ? "only"
              : params.excludeReplies
                ? "exclude"
                : undefined,
            limit: params.limit,
            cursor: params.cursor,
          },
          { viewerDid },
        );

        return {
          body: result,
        };
      },
    });
  }
}
