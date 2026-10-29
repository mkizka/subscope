import type { LexRouter } from "@atproto/lex-server";
import searchActorsTypeahead from "@repo/client/lex/app/bsky/actor/searchActorsTypeahead";

import type { SearchActorsTypeaheadUseCase } from "../../../../../application/use-cases/actor/search-actors-typeahead-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class SearchActorsTypeahead {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly searchActorsTypeaheadUseCase: SearchActorsTypeaheadUseCase,
  ) {}
  static inject = [
    "authVerifierMiddleware",
    "searchActorsTypeaheadUseCase",
  ] as const;

  handle(router: LexRouter) {
    router.add(searchActorsTypeahead, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const result = await this.searchActorsTypeaheadUseCase.execute({
          query: params.q,
          limit: params.limit,
          viewerDid,
        });

        return {
          body: result,
        };
      },
    });
  }
}
