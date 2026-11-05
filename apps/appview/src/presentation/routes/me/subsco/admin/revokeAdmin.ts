import { type LexRouter, LexServerError } from "@atproto/lex-server";
import revokeAdmin from "@repo/client/me/subsco/admin/revokeAdmin";

import {
  CannotRevokeSelfError,
  type RevokeAdminUseCase,
} from "../../../../../application/use-cases/admin/revoke-admin-use-case.js";
import { NotRegisteredError } from "../../../../../application/use-cases/sync/unregister-account-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class RevokeAdmin {
  constructor(
    private revokeAdminUseCase: RevokeAdminUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(revokeAdmin, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input, credentials }) => {
        try {
          await this.revokeAdminUseCase.execute({
            did: input.body.did,
            requesterDid: credentials.did,
          });
          return {};
        } catch (error) {
          if (
            error instanceof NotRegisteredError ||
            error instanceof CannotRevokeSelfError
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
