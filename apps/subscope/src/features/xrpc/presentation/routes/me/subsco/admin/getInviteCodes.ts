import type { Server } from "@repo/client/server";

import type { GetInviteCodesUseCase } from "../../../../../application/use-cases/admin/get-invite-codes-use-case.js";
import type { AdminMiddleware } from "../../../../middleware/admin-middleware.js";

export class GetInviteCodes {
  constructor(
    private getInviteCodesUseCase: GetInviteCodesUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}
  static inject = ["getInviteCodesUseCase", "adminMiddleware"] as const;

  handle(server: Server) {
    server.me.subsco.admin.getInviteCodes({
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx.req),
      handler: async ({ params }) => {
        const result = await this.getInviteCodesUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
