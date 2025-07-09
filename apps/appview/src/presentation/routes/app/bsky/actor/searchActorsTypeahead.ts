import type { Server } from "@repo/client/server";

import type { SearchActorsTypeaheadUseCase } from "../../../../../application/use-cases/actor/search-actors-typeahead-use-case.js";

export class SearchActorsTypeahead {
  constructor(
    private searchActorsTypeaheadUseCase: SearchActorsTypeaheadUseCase,
  ) {}
  static inject = ["searchActorsTypeaheadUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.actor.searchActorsTypeahead({
      handler: async ({ params }) => {
        const result = await this.searchActorsTypeaheadUseCase.execute({
          query: params.q,
          limit: params.limit,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
