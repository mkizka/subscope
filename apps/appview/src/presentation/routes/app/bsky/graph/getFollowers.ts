import type { LexRouter } from "@atproto/lex-server";
import getFollowers from "@repo/client/app/bsky/graph/getFollowers";

import type { GetFollowersUseCase } from "../../../../../application/use-cases/graph/get-followers-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetFollowers {
  constructor(
    private readonly deps: {
      getFollowersUseCase: GetFollowersUseCase;
      handleMiddleware: HandleMiddleware;
      authVerifierMiddleware: AuthVerifierMiddleware;
    },
  ) {}

  handle(router: LexRouter) {
    router.add(getFollowers, {
      auth: (ctx) => this.deps.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const accountDid = await this.deps.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );

        const result = await this.deps.getFollowersUseCase.execute({
          accountDid,
          viewerDid,
          limit: params.limit,
          cursor: params.cursor,
        });

        return {
          body: result,
        };
      },
    });
  }
}
