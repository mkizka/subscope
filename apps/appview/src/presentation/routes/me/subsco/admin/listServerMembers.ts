import type { LexRouter } from "@atproto/lex-server";
import listServerMembers from "@repo/client/me/subsco/admin/listServerMembers";

import type { ListServerMembersUseCase } from "../../../../../application/use-cases/admin/list-server-members-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class ListServerMembers {
  constructor(
    private listServerMembersUseCase: ListServerMembersUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(listServerMembers, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ params }) => {
        const result = await this.listServerMembersUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
        });

        return { body: result };
      },
    });
  }
}
