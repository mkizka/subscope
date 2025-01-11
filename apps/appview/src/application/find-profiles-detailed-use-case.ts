import type { AppBskyActorDefs } from "@dawn/client";

import type { IProfileRepository } from "./interfaces/profile-repository.js";

export class FindProfilesDetailedUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}
  static inject = ["profileRepository"] as const;

  async execute(dids: string[]) {
    const profiles = await this.profileRepository.findManyDetailed({ dids });

    return profiles.map((profile) => ({
      did: profile.did,
      handle: profile.handle,
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
    })) satisfies AppBskyActorDefs.ProfileViewDetailed[];
  }
}
