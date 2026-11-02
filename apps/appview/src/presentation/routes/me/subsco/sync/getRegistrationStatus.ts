import type { LexRouter } from "@atproto/lex-server";
import getRegistrationStatus from "@repo/client/lex/me/subsco/sync/getRegistrationStatus";

import type { GetRegistrationStatusUseCase } from "../../../../../application/use-cases/sync/get-registration-status-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetRegistrationStatus {
  constructor(
    private getRegistrationStatusUseCase: GetRegistrationStatusUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getRegistrationStatus, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ credentials }) => {
        const result = await this.getRegistrationStatusUseCase.execute({
          accountDid: credentials.did,
        });

        return {
          body: result,
        };
      },
    });
  }
}
