import type { LexRouter } from "@atproto/lex-server";
import getListFeed from "@repo/client/app/bsky/feed/getListFeed";

import type { GetListFeedUseCase } from "../../../../../application/use-cases/feed/get-list-feed-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { RepoRevMiddleware } from "../../../../../presentation/middleware/repo-rev-middleware.js";

export class GetListFeed {
  constructor(
    private readonly deps: {
      authVerifierMiddleware: AuthVerifierMiddleware;
      getListFeedUseCase: GetListFeedUseCase;
      repoRevMiddleware: RepoRevMiddleware;
    },
  ) {}

  handle(router: LexRouter) {
    router.add(getListFeed, {
      auth: (ctx) => this.deps.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const body = await this.deps.getListFeedUseCase.execute({
          listUri: params.list,
          limit: params.limit,
          cursor: params.cursor,
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
