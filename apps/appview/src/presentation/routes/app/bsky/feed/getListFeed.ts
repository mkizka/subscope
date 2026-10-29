import type { LexRouter } from "@atproto/lex-server";
import getListFeed from "@repo/client/lex/app/bsky/feed/getListFeed";

import type { GetListFeedUseCase } from "../../../../../application/use-cases/feed/get-list-feed-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetListFeed {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly getListFeedUseCase: GetListFeedUseCase,
  ) {}
  static inject = ["authVerifierMiddleware", "getListFeedUseCase"] as const;

  handle(router: LexRouter) {
    router.add(getListFeed, {
      auth: (ctx) => this.authVerifierMiddleware.lexOptionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const body = await this.getListFeedUseCase.execute({
          listUri: params.list,
          limit: params.limit,
          cursor: params.cursor,
          viewerDid: viewerDid ?? undefined,
        });
        return { body };
      },
    });
  }
}
