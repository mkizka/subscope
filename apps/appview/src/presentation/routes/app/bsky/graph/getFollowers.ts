import type { LexRouter } from "@atproto/lex-server";
import getFollowers from "@repo/client/app/bsky/graph/getFollowers";

import type { GetFollowersUseCase } from "../../../../../application/use-cases/graph/get-followers-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetFollowers {
  constructor(
    private getFollowersUseCase: GetFollowersUseCase,
    private handleMiddleware: HandleMiddleware,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getFollowers, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const accountDid = await this.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );

        const result = await this.getFollowersUseCase.execute({
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
