import type { AppBskyActorDefs, Server } from "@dawn/client";

import type { IProfileRepository } from "../../../../../domain/repositories/profile.js";

export class GetProfile {
  constructor(private profileRepository: IProfileRepository) {}
  static inject = ["profileRepository"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfile({
      handler: async ({ params }) => {
        const profile = await this.profileRepository.findOne(params.actor);
        if (!profile) {
          return {
            status: 404,
            message: "Profile not found",
          };
        }
        return {
          encoding: "application/json",
          body: {
            did: profile.did,
            handle: profile.handle,
          } satisfies AppBskyActorDefs.ProfileViewDetailed,
        };
      },
    });
  }
}
