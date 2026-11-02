import type { LexRouter } from "@atproto/lex-server";
import listRegisteredAccounts from "@repo/client/lex/me/subsco/admin/listRegisteredAccounts";

import type { ListRegisteredAccountsUseCase } from "../../../../../application/use-cases/admin/list-registered-accounts-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class ListRegisteredAccounts {
  constructor(
    private listRegisteredAccountsUseCase: ListRegisteredAccountsUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(listRegisteredAccounts, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ params }) => {
        const result = await this.listRegisteredAccountsUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
        });

        return { body: result };
      },
    });
  }
}
