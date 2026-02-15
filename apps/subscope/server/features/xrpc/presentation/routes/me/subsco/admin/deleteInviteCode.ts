import type { Server } from "@repo/client/server";

import type { DeleteInviteCodeUseCase } from "@/server/features/xrpc/application/use-cases/admin/delete-invite-code-use-case.js";
import type { AdminMiddleware } from "@/server/features/xrpc/presentation/middleware/admin-middleware.js";

export class DeleteInviteCode {
  constructor(
    private deleteInviteCodeUseCase: DeleteInviteCodeUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}
  static inject = ["deleteInviteCodeUseCase", "adminMiddleware"] as const;

  handle(server: Server) {
    server.me.subsco.admin.deleteInviteCode({
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx.req),
      handler: async ({ input }) => {
        await this.deleteInviteCodeUseCase.execute({
          code: input.body.code,
        });
      },
    });
  }
}
