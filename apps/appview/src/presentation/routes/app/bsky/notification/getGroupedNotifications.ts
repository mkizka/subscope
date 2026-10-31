import { type LexRouter, LexServerError } from "@atproto/lex-server";
import getGroupedNotifications from "@repo/client/lex/app/bsky/notification/getGroupedNotifications";

import {
  type GetGroupedNotificationsUseCase,
  UnsupportedFeedError,
} from "../../../../../application/use-cases/notification/get-grouped-notifications-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetGroupedNotifications {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly getGroupedNotificationsUseCase: GetGroupedNotificationsUseCase,
  ) {}

  handle(router: LexRouter) {
    router.add(getGroupedNotifications, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ params, credentials }) => {
        try {
          const body = await this.getGroupedNotificationsUseCase.execute({
            viewerDid: credentials.did,
            limit: params.limit,
            cursor: params.cursor,
            feed: params.feed,
          });
          return { body };
        } catch (error) {
          if (error instanceof UnsupportedFeedError) {
            throw new LexServerError(501, {
              error: "MethodNotImplemented",
              message: error.message,
            });
          }
          throw error;
        }
      },
    });
  }
}
