import { type LexRouter, LexServerError } from "@atproto/lex-server";
import grantAdmin from "@repo/client/lex/me/subsco/admin/grantAdmin";

import type { GrantAdminUseCase } from "../../../../../application/use-cases/admin/grant-admin-use-case.js";
import { NotSubscribedError } from "../../../../../application/use-cases/sync/unsubscribe-server-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class GrantAdmin {
  constructor(
    private grantAdminUseCase: GrantAdminUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}
  static inject = ["grantAdminUseCase", "adminMiddleware"] as const;

  handle(router: LexRouter) {
    router.add(grantAdmin, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input }) => {
        try {
          await this.grantAdminUseCase.execute({ did: input.body.did });
          return {};
        } catch (error) {
          if (error instanceof NotSubscribedError) {
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
