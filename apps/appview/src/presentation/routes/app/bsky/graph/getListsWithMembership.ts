import type { LexRouter } from "@atproto/lex-server";
import getListsWithMembership from "@repo/client/app/bsky/graph/getListsWithMembership";

import type { GetListsWithMembershipUseCase } from "../../../../../application/use-cases/graph/get-lists-with-membership-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetListsWithMembership {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly getListsWithMembershipUseCase: GetListsWithMembershipUseCase,
    private readonly handleMiddleware: HandleMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getListsWithMembership, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ credentials, params }) => {
        const subjectDid = await this.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );
        const result = await this.getListsWithMembershipUseCase.execute({
          viewerDid: credentials.did,
          subjectDid,
          limit: params.limit,
          cursor: params.cursor,
          purposes: params.purposes,
        });
        return { body: result };
      },
    });
  }
}
