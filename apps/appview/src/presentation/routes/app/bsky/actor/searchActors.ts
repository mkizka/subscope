import type { Server } from "@repo/client/server";

import type { SearchActorsUseCase } from "../../../../../application/use-cases/actor/search-actors-use-case.js";

export class SearchActors {
  constructor(private searchActorsUseCase: SearchActorsUseCase) {}
  static inject = ["searchActorsUseCase", "db"] as const;

  handle(server: Server) {
    server.app.bsky.actor.searchActors({
      handler: async ({ params }) => {
        const result = await this.searchActorsUseCase.execute({
          query: params.q,
          limit: params.limit,
          cursor: params.cursor,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
