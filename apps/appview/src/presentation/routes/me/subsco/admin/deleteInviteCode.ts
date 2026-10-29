import { type LexRouter, LexServerError } from "@atproto/lex-server";
import deleteInviteCode from "@repo/client/lex/me/subsco/admin/deleteInviteCode";

import {
  type DeleteInviteCodeUseCase,
  InviteCodeAlreadyUsedError,
  InviteCodeNotFoundError,
} from "../../../../../application/use-cases/admin/delete-invite-code-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class DeleteInviteCode {
  constructor(
    private deleteInviteCodeUseCase: DeleteInviteCodeUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(deleteInviteCode, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input }) => {
        try {
          await this.deleteInviteCodeUseCase.execute({
            code: input.body.code,
          });
          return {};
        } catch (error) {
          if (
            error instanceof InviteCodeNotFoundError ||
            error instanceof InviteCodeAlreadyUsedError
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
