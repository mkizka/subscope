import { isDid } from "@atproto/did";
import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@dawn/client/server";
import { isHandle } from "@dawn/common/utils";

import type { GetProfilesUseCase } from "../../../../../application/get-profiles-use-case.js";

export class GetProfile {
  constructor(private getProfilesUseCase: GetProfilesUseCase) {}
  static inject = ["getProfilesUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfile({
      handler: async ({ params }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          throw new InvalidRequestError("Invalid actor");
        }
        const [profile] = await this.getProfilesUseCase.execute([params.actor]);
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
