import { asDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import unbanAccount from "@repo/client/me/subsco/admin/unbanAccount";

import {
  NotBannedError,
  type UnbanAccountUseCase,
} from "../../../../../application/use-cases/admin/unban-account-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class UnbanAccount {
  constructor(
    private unbanAccountUseCase: UnbanAccountUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(unbanAccount, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input }) => {
        try {
          await this.unbanAccountUseCase.execute({
            did: asDid(input.body.did),
          });
          return {};
        } catch (error) {
          if (error instanceof NotBannedError) {
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
