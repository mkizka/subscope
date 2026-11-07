import type { LexRouter } from "@atproto/lex-server";
import getFollowedAccounts from "@repo/client/me/subsco/server/getFollowedAccounts";

import type { GetFollowedAccountsUseCase } from "../../../../../application/use-cases/server/get-followed-accounts-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetFollowedAccounts {
  constructor(
    private getFollowedAccountsUseCase: GetFollowedAccountsUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getFollowedAccounts, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ params }) => {
        const result = await this.getFollowedAccountsUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
          q: params.q,
        });

        return { body: result };
      },
    });
  }
}
