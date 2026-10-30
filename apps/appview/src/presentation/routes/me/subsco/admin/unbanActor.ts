import { asDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import unbanActor from "@repo/client/lex/me/subsco/admin/unbanActor";

import {
  NotBannedError,
  type UnbanActorUseCase,
} from "../../../../../application/use-cases/admin/unban-actor-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class UnbanActor {
  constructor(
    private unbanActorUseCase: UnbanActorUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(unbanActor, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input }) => {
        try {
          await this.unbanActorUseCase.execute({ did: asDid(input.body.did) });
          return {};
        } catch (error) {
          if (error instanceof NotBannedError) {
            throw new LexServerError(400, {
              error: error.name,
              message: error.message,
            });
          }
          throw error;
        }
      },
    });
  }
}
