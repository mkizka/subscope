import { isDid } from "@atproto/did";
import type { Server } from "@dawn/client";
import { isHandle } from "@dawn/common/utils";

import type { FindProfilesDetailedUseCase } from "../../../../../application/find-profiles-detailed-use-case.js";

export class GetProfile {
  constructor(
    private findProfilesDetailedUseCase: FindProfilesDetailedUseCase,
  ) {}
  static inject = ["findProfilesDetailedUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfiles({
      handler: async ({ params }) => {
        const handleOrDids = params.actors.filter(
          (actor) => isDid(actor) || isHandle(actor),
        );
        const profiles =
          await this.findProfilesDetailedUseCase.execute(handleOrDids);
        return {
          encoding: "application/json",
          body: { profiles },
        };
      },
    });
  }
}
