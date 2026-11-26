import type { LexRouter } from "@atproto/lex-server";
import getFollows from "@repo/client/app/bsky/graph/getFollows";

import type { GetFollowsUseCase } from "../../../../../application/use-cases/graph/get-follows-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetFollows {
  constructor(
    private readonly deps: {
      getFollowsUseCase: GetFollowsUseCase;
      handleMiddleware: HandleMiddleware;
      authVerifierMiddleware: AuthVerifierMiddleware;
    },
  ) {}

  handle(router: LexRouter) {
    router.add(getFollows, {
      auth: (ctx) => this.deps.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const accountDid = await this.deps.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );

        const result = await this.deps.getFollowsUseCase.execute({
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
