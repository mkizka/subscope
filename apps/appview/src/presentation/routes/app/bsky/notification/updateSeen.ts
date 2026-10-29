import type { LexRouter } from "@atproto/lex-server";
import updateSeen from "@repo/client/lex/app/bsky/notification/updateSeen";

import type { UpdateSeenUseCase } from "../../../../../application/use-cases/notification/update-seen-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class UpdateSeen {
  constructor(
    private updateSeenUseCase: UpdateSeenUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(updateSeen, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ credentials, input }) => {
        await this.updateSeenUseCase.execute({
          actorDid: credentials.did,
          seenAt: new Date(input.body.seenAt),
        });
        return {};
      },
    });
  }
}
