import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@repo/client/server";

import {
  ActorNotFoundError,
  AdminAlreadyExistsError,
  type RegisterAdminUseCase,
} from "../../../../../application/use-cases/admin/register-admin-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

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
          if (
            error instanceof AdminAlreadyExistsError ||
            error instanceof ActorNotFoundError
          ) {
            throw new InvalidRequestError(error.message, error.name);
          }
          throw error;
        }
      },
    });
  }
}
