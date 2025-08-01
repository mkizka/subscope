import type { Server } from "@repo/client/server";

import type { CreateInviteCodeUseCase } from "../../../../../application/use-cases/admin/create-invite-code-use-case.js";
import type { AdminMiddleware } from "../../../../middleware/admin-middleware.js";

export class CreateInviteCode {
  constructor(
    private createInviteCodeUseCase: CreateInviteCodeUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}
  static inject = ["createInviteCodeUseCase", "adminMiddleware"] as const;

  handle(server: Server) {
    server.me.subsco.admin.createInviteCode({
      handler: async ({ input, req }) => {
        await this.adminMiddleware.requireAdmin(req);

        const result = await this.createInviteCodeUseCase.execute({
          daysToExpire: input.body.daysToExpire,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
