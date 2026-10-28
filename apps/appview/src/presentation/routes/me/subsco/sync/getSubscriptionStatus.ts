import type { LexRouter } from "@atproto/lex-server";
import getSubscriptionStatus from "@repo/client/lex/me/subsco/sync/getSubscriptionStatus";

import type { GetSubscriptionStatusUseCase } from "../../../../../application/use-cases/sync/get-subscription-status-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetSubscriptionStatus {
  constructor(
    private getSubscriptionStatusUseCase: GetSubscriptionStatusUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = [
    "getSubscriptionStatusUseCase",
    "authVerifierMiddleware",
  ] as const;

  handle(router: LexRouter) {
    router.add(getSubscriptionStatus, {
      auth: (ctx) => this.authVerifierMiddleware.lexLoginRequired(ctx),
      handler: async ({ credentials }) => {
        const result = await this.getSubscriptionStatusUseCase.execute({
          actorDid: credentials.did,
        });

        return {
          body: result,
        };
      },
    });
  }
}
