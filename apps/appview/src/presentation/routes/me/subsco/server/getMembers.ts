import { type LexRouter, LexServerError } from "@atproto/lex-server";
import getMembers from "@repo/client/lex/me/subsco/server/getMembers";

import type { GetMembersUseCase } from "../../../../../application/use-cases/server/get-members-use-case.js";
import { NotSubscribedError } from "../../../../../application/use-cases/sync/unsubscribe-server-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetMembers {
  constructor(
    private readonly getMembersUseCase: GetMembersUseCase,
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getMembers, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ params, credentials }) => {
        try {
          const result = await this.getMembersUseCase.execute({
            viewerDid: credentials.did,
            limit: params.limit,
            cursor: params.cursor,
          });
          return { body: result };
        } catch (error) {
          if (error instanceof NotSubscribedError) {
            throw new LexServerError(403, {
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
