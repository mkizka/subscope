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
      displayName: profile.displayName ?? undefined,
      description: profile.description ?? undefined,
      avatar: profile.getAvatarUrl() ?? undefined,
      // banner?: string
      // followersCount?: number
      // followsCount?: number
      // postsCount?: number
      // associated?: ProfileAssociated
      // joinedViaStarterPack?: AppBskyGraphDefs.StarterPackViewBasic
      indexedAt: profile.indexedAt?.toISOString(),
      createdAt: profile.createdAt?.toISOString(),
      // viewer?: ViewerState
      // labels?: ComAtprotoLabelDefs.Label[]
      // pinnedPost?: ComAtprotoRepoStrongRef.Main
    } satisfies AppBskyActorDefs.ProfileViewDetailed;
  }
}
