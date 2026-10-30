import type { LexRouter } from "@atproto/lex-server";
import getBannedActors from "@repo/client/lex/me/subsco/admin/getBannedActors";

import type { GetBannedActorsUseCase } from "../../../../../application/use-cases/admin/get-banned-actors-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class GetBannedActors {
  constructor(
    private getBannedActorsUseCase: GetBannedActorsUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getBannedActors, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ params }) => {
        const result = await this.getBannedActorsUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
        });

        return { body: result };
      },
    });
  }
}
