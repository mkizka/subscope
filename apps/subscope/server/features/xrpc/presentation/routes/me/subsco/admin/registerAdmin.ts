import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@repo/client/server";

import {
  AdminAlreadyExistsError,
  type RegisterAdminUseCase,
} from "@/server/features/xrpc/application/use-cases/admin/register-admin-use-case.js";
import type { AuthVerifierMiddleware } from "@/server/features/xrpc/presentation/middleware/auth-verifier-middleware.js";

export class RegisterAdmin {
  constructor(
    private readonly registerAdminUseCase: RegisterAdminUseCase,
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = ["registerAdminUseCase", "authVerifierMiddleware"] as const;

  handle(server: Server): void {
    server.me.subsco.admin.registerAdmin({
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx.req),
      handler: async ({ auth }) => {
        try {
          await this.registerAdminUseCase.execute({
            requesterDid: auth.credentials.did,
          });
        } catch (error) {
          if (error instanceof AdminAlreadyExistsError) {
            throw new InvalidRequestError(error.message, error.name);
          }
          throw error;
        }
      },
    });
  }
}
