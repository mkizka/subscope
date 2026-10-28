import type { LexRouter } from "@atproto/lex-server";
import getActorLikes from "@repo/client/lex/app/bsky/feed/getActorLikes";

import type { GetActorLikesUseCase } from "../../../../../application/use-cases/feed/get-actor-likes-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetActorLikes {
  constructor(
    private getActorLikesUseCase: GetActorLikesUseCase,
    private handleMiddleware: HandleMiddleware,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = [
    "getActorLikesUseCase",
    "handleMiddleware",
    "authVerifierMiddleware",
  ] as const;

  handle(router: LexRouter) {
    router.add(getActorLikes, {
      auth: (ctx) => this.authVerifierMiddleware.lexOptionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const actorDid = await this.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );

        const body = await this.getActorLikesUseCase.execute({
          actorDid,
          limit: params.limit,
          cursor: params.cursor ? new Date(params.cursor) : undefined,
          viewerDid: viewerDid ?? undefined,
        });

        return { body };
      },
    });
  }
}
