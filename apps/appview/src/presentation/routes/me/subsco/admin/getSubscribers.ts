import type { LexRouter } from "@atproto/lex-server";
import getSubscribers from "@repo/client/lex/me/subsco/admin/getSubscribers";

import type { GetSubscribersUseCase } from "../../../../../application/use-cases/admin/get-subscribers-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class GetSubscribers {
  constructor(
    private getSubscribersUseCase: GetSubscribersUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}
  static inject = ["getSubscribersUseCase", "adminMiddleware"] as const;

  handle(router: LexRouter) {
    router.add(getSubscribers, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ params }) => {
        const result = await this.getSubscribersUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
        });

        return { body: result };
      },
    });
  }
}
