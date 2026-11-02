import { asDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import registerAccount from "@repo/client/lex/me/subsco/sync/registerAccount";

import {
  AlreadyRegisteredError,
  BannedError,
  InvalidInviteCodeError,
  type RegisterAccountUseCase,
} from "../../../../../application/use-cases/sync/register-account-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class RegisterAccount {
  constructor(
    private registerAccountUseCase: RegisterAccountUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(registerAccount, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ input, credentials }) => {
        try {
          await this.registerAccountUseCase.execute({
            code: input.body.inviteCode,
            accountDid: asDid(credentials.did),
          });

          return {
            body: {
              success: true,
              message: "Successfully registered with the server",
            },
          };
        } catch (error) {
          if (
            error instanceof InvalidInviteCodeError ||
            error instanceof AlreadyRegisteredError ||
            error instanceof BannedError
          ) {
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
