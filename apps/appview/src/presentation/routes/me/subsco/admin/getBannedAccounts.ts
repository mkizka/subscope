import type { LexRouter } from "@atproto/lex-server";
import getBannedAccounts from "@repo/client/me/subsco/admin/getBannedAccounts";

import type { GetBannedAccountsUseCase } from "../../../../../application/use-cases/admin/get-banned-accounts-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class GetBannedAccounts {
  constructor(
    private getBannedAccountsUseCase: GetBannedAccountsUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getBannedAccounts, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ params }) => {
        const result = await this.getBannedAccountsUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
        });

        return { body: result };
      },
    });
  }
}
