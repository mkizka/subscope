import type { Server } from "@repo/client/server";

import type { VerifyAccessUseCase } from "../../../../../application/use-cases/admin/verify-access-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

export class VerifyAccess {
  constructor(
    private verifyAccessUseCase: VerifyAccessUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = ["verifyAccessUseCase", "authVerifierMiddleware"] as const;

  handle(server: Server) {
    server.me.subsco.admin.verifyAccess({
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx.req),
      handler: async ({ auth }) => {
        const result = await this.verifyAccessUseCase.execute({
          requesterDid: auth.credentials.did,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
