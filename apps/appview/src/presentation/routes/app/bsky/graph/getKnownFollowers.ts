import type { LexRouter } from "@atproto/lex-server";
import getKnownFollowers from "@repo/client/app/bsky/graph/getKnownFollowers";

import type { GetKnownFollowersUseCase } from "../../../../../application/use-cases/graph/get-known-followers-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetKnownFollowers {
  constructor(
    private readonly deps: {
      authVerifierMiddleware: AuthVerifierMiddleware;
      getKnownFollowersUseCase: GetKnownFollowersUseCase;
      handleMiddleware: HandleMiddleware;
    },
  ) {}

  handle(router: LexRouter) {
    router.add(getKnownFollowers, {
      auth: (ctx) => this.deps.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ credentials, params }) => {
        const subjectDid = await this.deps.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );
        const result = await this.deps.getKnownFollowersUseCase.execute({
          viewerDid: credentials.did,
          subjectDid,
          limit: params.limit,
          cursor: params.cursor,
        });
        return { body: result };
      },
    });
  }
}
