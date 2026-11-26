import type { LexRouter } from "@atproto/lex-server";
import getAuthorFeed from "@repo/client/app/bsky/feed/getAuthorFeed";

import type { GetAuthorFeedUseCase } from "../../../../../application/use-cases/feed/get-author-feed-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";
import type { RepoRevMiddleware } from "../../../../../presentation/middleware/repo-rev-middleware.js";

export class GetAuthorFeed {
  constructor(
    private readonly deps: {
      getAuthorFeedUseCase: GetAuthorFeedUseCase;
      handleMiddleware: HandleMiddleware;
      authVerifierMiddleware: AuthVerifierMiddleware;
      repoRevMiddleware: RepoRevMiddleware;
    },
  ) {}

  handle(router: LexRouter) {
    router.add(getAuthorFeed, {
      auth: (ctx) => this.deps.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const accountDid = await this.deps.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );

        const body = await this.deps.getAuthorFeedUseCase.execute({
          accountDid,
          limit: params.limit,
          cursor: params.cursor ? new Date(params.cursor) : undefined,
          filter: params.filter,
          includePins: params.includePins,
          viewerDid: viewerDid ?? undefined,
        });
        return {
          headers: await this.deps.repoRevMiddleware.headers(viewerDid),
          body,
        };
      },
    });
  }
}
