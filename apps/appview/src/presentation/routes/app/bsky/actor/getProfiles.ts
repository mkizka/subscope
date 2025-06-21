import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { GetProfilesUseCase } from "../../../../../application/get-profiles-use-case.js";
import type { HandleService } from "../../../../../application/service/handle-service.js";

export class GetProfiles {
  constructor(
    private getProfilesUseCase: GetProfilesUseCase,
    private handleService: HandleService,
  ) {}
  static inject = ["getProfilesUseCase", "handleService"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfiles({
      handler: async ({ params }) => {
        const handleOrDids = params.actors.filter(
          (actor) => isDid(actor) || isHandle(actor),
        );
        const dids = await this.handleService.resolveHandleOrDids(handleOrDids);
        const profiles = await this.getProfilesUseCase.execute(dids);
        return {
          encoding: "application/json",
          body: { profiles },
        };
      },
    });
  }
}
