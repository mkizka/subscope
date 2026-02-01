import type { Server } from "@repo/client/server";

import type { SearchActorsUseCase } from "@/server/features/xrpc/application/use-cases/actor/search-actors-use-case.js";
import type { AuthVerifierMiddleware } from "@/server/features/xrpc/presentation/middleware/auth-verifier-middleware.js";

export class SearchActors {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly searchActorsUseCase: SearchActorsUseCase,
  ) {}
  static inject = ["authVerifierMiddleware", "searchActorsUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.actor.searchActors({
      handler: async ({ params, req }) => {
        const viewerDid = await this.authVerifierMiddleware.getViewerDid(req);

        const result = await this.searchActorsUseCase.execute({
          query: params.q,
          limit: params.limit,
          cursor: params.cursor,
          viewerDid,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
