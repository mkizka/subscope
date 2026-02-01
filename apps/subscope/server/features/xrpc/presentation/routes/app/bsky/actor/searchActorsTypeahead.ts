import type { Server } from "@repo/client/server";

import type { SearchActorsTypeaheadUseCase } from "@/server/features/xrpc/application/use-cases/actor/search-actors-typeahead-use-case.js";
import type { AuthVerifierMiddleware } from "@/server/features/xrpc/presentation/middleware/auth-verifier-middleware.js";

export class SearchActorsTypeahead {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly searchActorsTypeaheadUseCase: SearchActorsTypeaheadUseCase,
  ) {}
  static inject = [
    "authVerifierMiddleware",
    "searchActorsTypeaheadUseCase",
  ] as const;

  handle(server: Server) {
    server.app.bsky.actor.searchActorsTypeahead({
      handler: async ({ params, req }) => {
        const viewerDid = await this.authVerifierMiddleware.getViewerDid(req);

        const result = await this.searchActorsTypeaheadUseCase.execute({
          query: params.q,
          limit: params.limit,
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
