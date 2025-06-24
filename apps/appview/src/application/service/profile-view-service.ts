import type { Did } from "@atproto/did";
import type { $Typed, AppBskyActorDefs } from "@repo/client/server";
import type { ProfileDetailed } from "@repo/common/domain";

import { env } from "../../shared/env.js";
import type { IActorStatsRepository } from "../interfaces/actor-stats-repository.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";

export class ProfileViewService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly actorStatsRepository: IActorStatsRepository,
  ) {}
  static inject = ["profileRepository", "actorStatsRepository"] as const;

  private async findProfile(dids: Did[]) {
    return await this.profileRepository.findManyDetailed(dids);
  }

  private createProfileViewBasic(
    profile: ProfileDetailed,
  ): $Typed<AppBskyActorDefs.ProfileViewBasic> {
    return {
      $type: "app.bsky.actor.defs#profileViewBasic",
      did: profile.actorDid,
      handle: profile.handle?.toString() ?? "handle.invalid",
      displayName: profile.displayName ?? undefined,
      avatar: this.getAvatarThumbnailUrl(profile),
      // associated?: ProfileAssociated
      // viewer?: ViewerState
      // labels?: ComAtprotoLabelDefs.Label[]
      createdAt: profile.createdAt?.toISOString(),
    };
  }

  private createProfileViewDetailed(
    profile: ProfileDetailed,
    stats?: {
      followsCount: number;
      followersCount: number;
      postsCount: number;
    },
  ): $Typed<AppBskyActorDefs.ProfileViewDetailed> {
    return {
      ...this.createProfileViewBasic(profile),
      $type: "app.bsky.actor.defs#profileViewDetailed",
      // description?: string
      // banner?: string
      followersCount: stats?.followersCount,
      followsCount: stats?.followsCount,
      postsCount: stats?.postsCount,
      // joinedViaStarterPack?: AppBskyGraphDefs.StarterPackViewBasic
      indexedAt: profile.indexedAt?.toISOString(),
      // pinnedPost?: ComAtprotoRepoStrongRef.Main
    };
  }

  async findProfileViewBasic(dids: Did[]) {
    const profiles = await this.findProfile(dids);
    return profiles.map((profile) => this.createProfileViewBasic(profile));
  }

  async findProfileViewDetailed(dids: Did[]) {
    const profiles = await this.findProfile(dids);
    const statsMap = await this.actorStatsRepository.findStats(dids);
    return profiles.map((profile) => {
      const stats = statsMap.get(profile.actorDid);
      return this.createProfileViewDetailed(profile, stats);
    });
  }

  async findProfileView(
    dids: Did[],
  ): Promise<$Typed<AppBskyActorDefs.ProfileView>[]> {
    const profiles = await this.findProfile(dids);
    return profiles.map((profile) => ({
      ...this.createProfileViewBasic(profile),
      $type: "app.bsky.actor.defs#profileView" as const,
      description: profile.description ?? undefined,
      indexedAt: profile.indexedAt?.toISOString(),
    }));
  }

  private getAvatarThumbnailUrl(profile: ProfileDetailed) {
    if (!profile.avatar) {
      return undefined;
    }
    return `${env.BLOB_PROXY_URL}/images/avatar_thumbnail/${profile.actorDid}/${profile.avatar.cid}.jpg`;
  }
}
