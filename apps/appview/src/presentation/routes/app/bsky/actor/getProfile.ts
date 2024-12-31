import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@dawn/client";

import type { FindProfileDetailedUseCase } from "../../../../../application/find-profile-detailed-use-case.js";

export class GetProfile {
  constructor(private findProfileDetailedUseCase: FindProfileDetailedUseCase) {}
  static inject = ["findProfileDetailedUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfile({
      handler: async ({ params }) => {
        const profile = await this.findProfileDetailedUseCase.execute(
          params.actor,
        );
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
