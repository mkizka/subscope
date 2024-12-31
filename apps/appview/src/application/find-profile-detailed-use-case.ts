import type { AppBskyActorDefs } from "@dawn/client";

import type { IProfileRepository } from "../domain/profile/profile-repository.js";
import type { IUserRepository } from "../domain/user/user-repository.js";

export class FindProfileDetailedUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly userRepository: IUserRepository,
  ) {}
  static inject = ["profileRepository", "userRepository"] as const;

  async execute(did: string) {
    const [profile, user] = await Promise.all([
      this.profileRepository.findOne({ did }),
      this.userRepository.findOne({ did }),
    ]);
    if (!profile || !user) {
      return null;
    }
    return {
      did: profile.did,
      handle: user.handle,
      avatar: profile.getAvatarUrl() ?? undefined,
    } satisfies AppBskyActorDefs.ProfileViewDetailed;
  }
}
