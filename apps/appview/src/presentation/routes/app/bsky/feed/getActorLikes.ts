import type { LexRouter } from "@atproto/lex-server";
import getActorLikes from "@repo/client/app/bsky/feed/getActorLikes";

import type { GetActorLikesUseCase } from "../../../../../application/use-cases/feed/get-actor-likes-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";
import type { RepoRevMiddleware } from "../../../../../presentation/middleware/repo-rev-middleware.js";

export class GetActorLikes {
  constructor(
    private readonly deps: {
      getActorLikesUseCase: GetActorLikesUseCase;
      handleMiddleware: HandleMiddleware;
      authVerifierMiddleware: AuthVerifierMiddleware;
      repoRevMiddleware: RepoRevMiddleware;
    },
  ) {}

  handle(router: LexRouter) {
    router.add(getActorLikes, {
      auth: (ctx) => this.deps.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const accountDid = await this.deps.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );

        const body = await this.deps.getActorLikesUseCase.execute({
          accountDid,
          limit: params.limit,
          cursor: params.cursor ? new Date(params.cursor) : undefined,
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
