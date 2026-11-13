import type { LexRouter } from "@atproto/lex-server";
import getLikes from "@repo/client/app/bsky/feed/getLikes";

import type { GetLikesUseCase } from "../../../../../application/use-cases/feed/get-likes-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

export class GetLikes {
  constructor(
    private getLikesUseCase: GetLikesUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getLikes, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const result = await this.getLikesUseCase.execute(params, {
          viewerDid,
        });
        return { body: result };
      },
    });
  }
}
