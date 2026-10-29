import { type LexRouter, LexServerError } from "@atproto/lex-server";
import registerAdmin from "@repo/client/lex/me/subsco/admin/registerAdmin";

import {
  AdminAlreadyExistsError,
  type RegisterAdminUseCase,
} from "../../../../../application/use-cases/admin/register-admin-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class RegisterAdmin {
  constructor(
    private readonly registerAdminUseCase: RegisterAdminUseCase,
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = ["registerAdminUseCase", "authVerifierMiddleware"] as const;

  handle(router: LexRouter): void {
    router.add(registerAdmin, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ credentials }) => {
        try {
          await this.registerAdminUseCase.execute({
            requesterDid: credentials.did,
          });
          return {};
        } catch (error) {
          if (error instanceof AdminAlreadyExistsError) {
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
