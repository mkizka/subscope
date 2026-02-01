import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { GetAuthorFeedUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-author-feed-use-case.js";
import type { AuthVerifierMiddleware } from "@/server/features/xrpc/presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "@/server/features/xrpc/presentation/middleware/handle-middleware.js";

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

  handle(server: Server) {
    server.app.bsky.feed.getAuthorFeed({
      handler: async ({ params, req }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          return {
            status: 400,
            message: "Invalid actor",
          };
        }

        const [actorDid, viewerDid] = await Promise.all([
          this.handleMiddleware.resolveHandleOrDid(params.actor),
          this.authVerifierMiddleware.getViewerDid(req),
        ]);

        const result = await this.getAuthorFeedUseCase.execute({
          actorDid,
          limit: params.limit,
          cursor: params.cursor ? new Date(params.cursor) : undefined,
          filter: params.filter,
          includePins: params.includePins,
          viewerDid: viewerDid || undefined,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
