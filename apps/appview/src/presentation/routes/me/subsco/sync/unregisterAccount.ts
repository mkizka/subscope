import { asDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import unregisterAccount from "@repo/client/me/subsco/sync/unregisterAccount";

import {
  NotRegisteredError,
  type UnregisterAccountUseCase,
} from "../../../../../application/use-cases/sync/unregister-account-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class UnregisterAccount {
  constructor(
    private unregisterAccountUseCase: UnregisterAccountUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(unregisterAccount, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ credentials }) => {
        try {
          await this.unregisterAccountUseCase.execute({
            accountDid: asDid(credentials.did),
          });

          return {
            body: {
              success: true,
              message: "Successfully unregistered from the server",
            },
          };
        } catch (error) {
          if (error instanceof NotRegisteredError) {
            throw new LexServerError(400, {
              error: error.name,
              message: error.message,
            });
          }
          throw error;
        }
      },
    });
  }
}
