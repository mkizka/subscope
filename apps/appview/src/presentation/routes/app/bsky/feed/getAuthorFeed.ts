import type { LexRouter } from "@atproto/lex-server";
import getAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";

import type { GetAuthorFeedUseCase } from "../../../../../application/use-cases/feed/get-author-feed-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetAuthorFeed {
  constructor(
    private getAuthorFeedUseCase: GetAuthorFeedUseCase,
    private handleMiddleware: HandleMiddleware,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = [
    "getAuthorFeedUseCase",
    "handleMiddleware",
    "authVerifierMiddleware",
  ] as const;

  handle(router: LexRouter) {
    router.add(getAuthorFeed, {
      auth: (ctx) => this.authVerifierMiddleware.lexOptionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const actorDid = await this.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );

        const body = await this.getAuthorFeedUseCase.execute({
          actorDid,
          limit: params.limit,
          cursor: params.cursor ? new Date(params.cursor) : undefined,
          filter: params.filter,
          includePins: params.includePins,
          viewerDid: viewerDid ?? undefined,
        });

        return { body };
      },
    });
  }
}
