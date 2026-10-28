import type { LexRouter } from "@atproto/lex-server";
import deleteInviteCode from "@repo/client/lex/me/subsco/admin/deleteInviteCode";

import type { DeleteInviteCodeUseCase } from "../../../../../application/use-cases/admin/delete-invite-code-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class DeleteInviteCode {
  constructor(
    private deleteInviteCodeUseCase: DeleteInviteCodeUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}
  static inject = ["deleteInviteCodeUseCase", "adminMiddleware"] as const;

  handle(router: LexRouter) {
    router.add(deleteInviteCode, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input }) => {
        await this.deleteInviteCodeUseCase.execute({
          code: input.body.code,
        });
        return {};
      },
    });
  }
}
