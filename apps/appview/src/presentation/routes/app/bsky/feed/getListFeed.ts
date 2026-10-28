import type { Server } from "@repo/client/server";

import type { GetListFeedUseCase } from "../../../../../application/use-cases/feed/get-list-feed-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetListFeed {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly getListFeedUseCase: GetListFeedUseCase,
  ) {}
  static inject = ["authVerifierMiddleware", "getListFeedUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getListFeed({
      handler: async ({ params, req }) => {
        const viewerDid = await this.authVerifierMiddleware.getViewerDid(req);
        const result = await this.getListFeedUseCase.execute({
          listUri: params.list,
          limit: params.limit,
          cursor: params.cursor,
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
