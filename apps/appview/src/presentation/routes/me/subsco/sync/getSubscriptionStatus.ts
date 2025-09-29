import type { Server } from "@repo/client/server";

import type { GetSubscriptionStatusUseCase } from "../../../../../application/get-subscription-status-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

export class GetSubscriptionStatus {
  constructor(
    private getSubscriptionStatusUseCase: GetSubscriptionStatusUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = [
    "getSubscriptionStatusUseCase",
    "authVerifierMiddleware",
  ] as const;

  handle(server: Server) {
    server.me.subsco.sync.getSubscriptionStatus({
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx.req),
      handler: async ({ auth }) => {
        const result = await this.getSubscriptionStatusUseCase.execute({
          actorDid: auth.credentials.did,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
