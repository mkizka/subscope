import { asDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import banAccount from "@repo/client/me/subsco/admin/banAccount";

import {
  type BanAccountUseCase,
  CannotBanAdminError,
} from "../../../../../application/use-cases/admin/ban-account-use-case.js";
import { NotRegisteredError } from "../../../../../application/use-cases/sync/unregister-account-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class BanAccount {
  constructor(
    private banAccountUseCase: BanAccountUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}
  static inject = ["banAccountUseCase", "adminMiddleware"] as const;

  handle(router: LexRouter) {
    router.add(banAccount, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input }) => {
        try {
          await this.banAccountUseCase.execute({
            did: asDid(input.body.did),
          });
          return {};
        } catch (error) {
          if (
            error instanceof NotRegisteredError ||
            error instanceof CannotBanAdminError
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
