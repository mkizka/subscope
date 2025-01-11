import type { Server } from "@dawn/client";

import type { FindProfilesDetailedUseCase } from "../../../../../application/find-profiles-detailed-use-case.js";

export class GetProfile {
  constructor(
    private findProfilesDetailedUseCase: FindProfilesDetailedUseCase,
  ) {}
  static inject = ["findProfilesDetailedUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfiles({
      handler: async ({ params }) => {
        const profiles = await this.findProfilesDetailedUseCase.execute(
          params.actors,
        );
        return {
          encoding: "application/json",
          body: { profiles },
        };
      },
    });
  }
}
