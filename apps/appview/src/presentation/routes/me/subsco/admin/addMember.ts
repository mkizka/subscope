import { type LexRouter, LexServerError } from "@atproto/lex-server";
import addMember from "@repo/client/me/subsco/admin/addMember";

import {
  AlreadyRegisteredError,
  BannedError,
} from "../../../../../application/service/sync/validate-registration-service.js";
import {
  AccountNotFoundError,
  type AddMemberUseCase,
} from "../../../../../application/use-cases/admin/add-member-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class AddMember {
  constructor(
    private addMemberUseCase: AddMemberUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(addMember, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input }) => {
        try {
          await this.addMemberUseCase.execute({ actor: input.body.actor });
          return {};
        } catch (error) {
          if (
            error instanceof AccountNotFoundError ||
            error instanceof AlreadyRegisteredError ||
            error instanceof BannedError
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
