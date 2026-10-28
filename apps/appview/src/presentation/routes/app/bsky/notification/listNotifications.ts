import type { Server } from "@repo/client/server";

import type { ListNotificationsUseCase } from "../../../../../application/use-cases/notification/list-notifications-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class ListNotifications {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
  ) {}
  static inject = [
    "authVerifierMiddleware",
    "listNotificationsUseCase",
  ] as const;

  handle(server: Server) {
    server.app.bsky.notification.listNotifications({
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx.req),
      handler: async ({ params, auth }) => {
        const body = await this.listNotificationsUseCase.execute({
          viewerDid: auth.credentials.did,
          limit: params.limit,
          cursor: params.cursor,
        });
        return { encoding: "application/json", body };
      },
    });
  }
}
