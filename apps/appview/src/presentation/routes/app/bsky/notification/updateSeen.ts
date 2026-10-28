import type { Server } from "@repo/client/server";

import type { UpdateSeenUseCase } from "../../../../../application/use-cases/notification/update-seen-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class UpdateSeen {
  constructor(
    private updateSeenUseCase: UpdateSeenUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = ["updateSeenUseCase", "authVerifierMiddleware"] as const;

  handle(server: Server) {
    server.app.bsky.notification.updateSeen({
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx.req),
      handler: async ({ auth, input }) => {
        await this.updateSeenUseCase.execute({
          actorDid: auth.credentials.did,
          seenAt: new Date(input.body.seenAt),
        });
      },
    });
  }
}
