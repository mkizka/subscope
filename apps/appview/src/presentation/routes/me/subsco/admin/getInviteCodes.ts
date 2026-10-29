import type { LexRouter } from "@atproto/lex-server";
import getInviteCodes from "@repo/client/lex/me/subsco/admin/getInviteCodes";

import type { GetInviteCodesUseCase } from "../../../../../application/use-cases/admin/get-invite-codes-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class GetInviteCodes {
  constructor(
    private getInviteCodesUseCase: GetInviteCodesUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getInviteCodes, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ params }) => {
        const result = await this.getInviteCodesUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
        });

        return { body: result };
      },
    });
  }
}
