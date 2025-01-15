import { isDid } from "@atproto/did";
import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@dawn/client";
import { isHandle } from "@dawn/common/utils";

import type { FindProfilesDetailedUseCase } from "../../../../../application/find-profiles-detailed-use-case.js";

export class GetProfile {
  constructor(
    private findProfilesDetailedUseCase: FindProfilesDetailedUseCase,
  ) {}
  static inject = ["findProfilesDetailedUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfile({
      handler: async ({ params }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          throw new InvalidRequestError("Invalid actor");
        }
        const [profile] = await this.findProfilesDetailedUseCase.execute([
          params.actor,
        ]);
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
