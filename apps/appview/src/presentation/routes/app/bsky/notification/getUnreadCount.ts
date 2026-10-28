import type { Server } from "@repo/client/server";

import type { GetUnreadCountUseCase } from "../../../../../application/use-cases/notification/get-unread-count-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetUnreadCount {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
  ) {}
  static inject = ["authVerifierMiddleware", "getUnreadCountUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.notification.getUnreadCount({
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx.req),
      handler: async ({ auth }) => {
        const count = await this.getUnreadCountUseCase.execute(
          auth.credentials.did,
        );
        return { encoding: "application/json", body: { count } };
      },
    });
  }
}
