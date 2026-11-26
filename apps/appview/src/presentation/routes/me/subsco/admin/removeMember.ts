import { asDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import removeMember from "@repo/client/me/subsco/admin/removeMember";

import { NotMemberError } from "../../../../../application/service/sync/unregister-account-service.js";
import {
  CannotRemoveAdminError,
  type RemoveMemberUseCase,
} from "../../../../../application/use-cases/admin/remove-member-use-case.js";
import type { AdminMiddleware } from "../../../../../presentation/middleware/admin-middleware.js";

export class RemoveMember {
  constructor(
    private removeMemberUseCase: RemoveMemberUseCase,
    private adminMiddleware: AdminMiddleware,
  ) {}
  static inject = ["removeMemberUseCase", "adminMiddleware"] as const;

  handle(router: LexRouter) {
    router.add(removeMember, {
      auth: (ctx) => this.adminMiddleware.requireAdmin(ctx),
      handler: async ({ input }) => {
        try {
          await this.removeMemberUseCase.execute({
            did: asDid(input.body.did),
          });
          return {};
        } catch (error) {
          if (
            error instanceof NotMemberError ||
            error instanceof CannotRemoveAdminError
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
