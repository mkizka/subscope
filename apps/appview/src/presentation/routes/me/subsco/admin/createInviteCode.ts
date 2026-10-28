import type { LexRouter } from "@atproto/lex-server";
import createInviteCode from "@repo/client/lex/me/subsco/admin/createInviteCode";

import type { CreateInviteCodeUseCase } from "../../../../../application/use-cases/admin/create-invite-code-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class CreateInviteCode {
  constructor(
    private createInviteCodeUseCase: CreateInviteCodeUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}
  static inject = ["createInviteCodeUseCase", "adminMiddleware"] as const;

  handle(router: LexRouter) {
    router.add(createInviteCode, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input }) => {
        const result = await this.createInviteCodeUseCase.execute({
          daysToExpire: input.body.daysToExpire,
        });

        return { body: result };
      },
    });
  }
}
