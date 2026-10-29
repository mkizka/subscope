import type { LexRouter } from "@atproto/lex-server";
import getUnreadCount from "@repo/client/lex/app/bsky/notification/getUnreadCount";

import type { GetUnreadCountUseCase } from "../../../../../application/use-cases/notification/get-unread-count-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetUnreadCount {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
  ) {}
  static inject = ["authVerifierMiddleware", "getUnreadCountUseCase"] as const;

  handle(router: LexRouter) {
    router.add(getUnreadCount, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ credentials }) => {
        const count = await this.getUnreadCountUseCase.execute(credentials.did);
        return { body: { count } };
      },
    });
  }
}
