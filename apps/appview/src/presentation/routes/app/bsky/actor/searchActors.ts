import type { LexRouter } from "@atproto/lex-server";
import searchActors from "@repo/client/lex/app/bsky/actor/searchActors";

import type { SearchActorsUseCase } from "../../../../../application/use-cases/actor/search-actors-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class SearchActors {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly searchActorsUseCase: SearchActorsUseCase,
  ) {}

  handle(router: LexRouter) {
    router.add(searchActors, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const result = await this.searchActorsUseCase.execute({
          query: params.q,
          limit: params.limit,
          cursor: params.cursor,
          viewerDid,
        });

        return {
          body: result,
        };
      },
    });
  }
}
