import type { Server } from "@repo/client/server";

import type { SearchActorsUseCase } from "../../../../../application/search-actors-use-case.js";

export class SearchActors {
  constructor(private searchActorsUseCase: SearchActorsUseCase) {}
  static inject = ["searchActorsUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.actor.searchActors({
      handler: async ({ params }) => {
        const result = await this.searchActorsUseCase.execute(params);
        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}
