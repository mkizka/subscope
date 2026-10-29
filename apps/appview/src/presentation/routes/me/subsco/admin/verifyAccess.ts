import type { LexRouter } from "@atproto/lex-server";
import verifyAccess from "@repo/client/lex/me/subsco/admin/verifyAccess";

import type { VerifyAccessUseCase } from "../../../../../application/use-cases/admin/verify-access-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class VerifyAccess {
  constructor(
    private verifyAccessUseCase: VerifyAccessUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(verifyAccess, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ credentials }) => {
        const result = await this.verifyAccessUseCase.execute({
          requesterDid: credentials.did,
        });

        return { body: result };
      },
    });
  }
}
