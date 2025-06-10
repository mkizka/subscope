import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { GetProfilesUseCase } from "../../../../../application/get-profiles-use-case.js";

export class GetProfiles {
  constructor(private getProfilesUseCase: GetProfilesUseCase) {}
  static inject = ["getProfilesUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfiles({
      handler: async ({ params }) => {
        const handleOrDids = params.actors.filter(
          (actor) => isDid(actor) || isHandle(actor),
        );
        const profiles = await this.getProfilesUseCase.execute(handleOrDids);
        return {
          encoding: "application/json",
          body: { profiles },
        };
      },
    });
  }
}
