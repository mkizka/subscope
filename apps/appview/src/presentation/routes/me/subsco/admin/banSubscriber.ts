import { asDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import banSubscriber from "@repo/client/lex/me/subsco/admin/banSubscriber";

import {
  type BanSubscriberUseCase,
  CannotBanAdminError,
} from "../../../../../application/use-cases/admin/ban-subscriber-use-case.js";
import { NotSubscribedError } from "../../../../../application/use-cases/sync/unsubscribe-server-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class BanSubscriber {
  constructor(
    private banSubscriberUseCase: BanSubscriberUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}
  static inject = ["banSubscriberUseCase", "adminMiddleware"] as const;

  handle(router: LexRouter) {
    router.add(banSubscriber, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input }) => {
        try {
          await this.banSubscriberUseCase.execute({
            did: asDid(input.body.did),
          });
          return {};
        } catch (error) {
          if (
            error instanceof NotSubscribedError ||
            error instanceof CannotBanAdminError
          ) {
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
