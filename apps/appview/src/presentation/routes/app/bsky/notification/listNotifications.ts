import type { LexRouter } from "@atproto/lex-server";
import listNotifications from "@repo/client/lex/app/bsky/notification/listNotifications";

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

  handle(router: LexRouter) {
    router.add(listNotifications, {
      auth: (ctx) => this.authVerifierMiddleware.lexLoginRequired(ctx),
      handler: async ({ params, credentials }) => {
        const body = await this.listNotificationsUseCase.execute({
          viewerDid: credentials.did,
          limit: params.limit,
          cursor: params.cursor,
        });
        return { body };
      },
    });
  }
}
