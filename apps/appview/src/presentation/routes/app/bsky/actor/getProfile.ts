import { isDid } from "@atproto/did";
import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { GetProfilesUseCase } from "../../../../../application/get-profiles-use-case.js";
import type { HandleService } from "../../../../../application/service/request/handle-service.js";

export class GetProfile {
  constructor(
    private getProfilesUseCase: GetProfilesUseCase,
    private handleService: HandleService,
  ) {}
  static inject = ["getProfilesUseCase", "handleService"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfile({
      handler: async ({ params }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          throw new InvalidRequestError("Invalid actor");
        }
        const did = await this.handleService.resolveHandleOrDid(params.actor);
        const [profile] = await this.getProfilesUseCase.execute([did]);
        if (!profile) {
          throw new InvalidRequestError("Profile not found");
        }
        return {
          encoding: "application/json",
          body: profile,
        };
      },
    });
  }
}
