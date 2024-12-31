import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@dawn/client";

import type { IProfileRepository } from "../../../../../domain/repositories/profile.js";

export class GetProfile {
  constructor(private profileRepository: IProfileRepository) {}
  static inject = ["profileRepository"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfile({
      handler: async ({ params }) => {
        const profile = await this.profileRepository.findOne({
          did: params.actor,
        });
        if (!profile) {
          throw new InvalidRequestError("Profile not found");
        }
        return {
          encoding: "application/json",
          body: profile.toRecord(),
        };
      },
    });
  }
}
