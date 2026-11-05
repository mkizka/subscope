import type { LexRouter } from "@atproto/lex-server";
import getTrackedAccounts from "@repo/client/me/subsco/server/getTrackedAccounts";

import type { GetTrackedAccountsUseCase } from "../../../../../application/use-cases/server/get-tracked-accounts-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetTrackedAccounts {
  constructor(
    private getTrackedAccountsUseCase: GetTrackedAccountsUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getTrackedAccounts, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ params }) => {
        const result = await this.getTrackedAccountsUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
          q: params.q,
        });

        return { body: result };
      },
    });
  }
}
