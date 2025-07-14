import { type Did } from "@atproto/did";
import type { $Typed, AppBskyActorDefs } from "@repo/client/server";

import type { IActorStatsRepository } from "../../interfaces/actor-stats-repository.js";
import type { IFollowRepository } from "../../interfaces/follow-repository.js";
import type { IProfileRepository } from "../../interfaces/profile-repository.js";
import type { ProfileViewBuilder } from "./profile-view-builder.js";

export class ProfileViewService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly followRepository: IFollowRepository,
    private readonly profileViewBuilder: ProfileViewBuilder,
  ) {}
  static inject = [
    "profileRepository",
    "actorStatsRepository",
    "followRepository",
    "profileViewBuilder",
  ] as const;

  async findProfileViewBasic(dids: Did[]) {
    const profiles = await this.profileRepository.findManyDetailed(dids);
    return profiles.map((profile) =>
      this.profileViewBuilder.profileViewBasic(
        profile,
        this.profileViewBuilder.emptyViewerState(),
      ),
    );
  }

  async findProfileViewDetailed(dids: Did[], viewerDid?: Did | null) {
    const profiles = await this.profileRepository.findManyDetailed(dids);
    const statsMap = await this.actorStatsRepository.findStats(dids);

    if (!viewerDid) {
      return profiles.map((profile) => {
        const stats = statsMap.get(profile.actorDid);
        return this.profileViewBuilder.profileViewDetailed(
          profile,
          this.profileViewBuilder.emptyViewerState(),
          stats,
        );
      });
    }

    const targetDids = profiles.map((profile) => profile.actorDid);
    const [followingMap, followedByMap] = await Promise.all([
      this.followRepository.findFollowingMap({
        actorDid: viewerDid,
        targetDids,
      }),
      this.followRepository.findFollowedByMap({
        actorDid: viewerDid,
        targetDids,
      }),
    ]);

    return profiles.map((profile) => {
      const stats = statsMap.get(profile.actorDid);
      const viewerState = this.profileViewBuilder.viewerState(
        profile.actorDid,
        followingMap,
        followedByMap,
      );
      return this.profileViewBuilder.profileViewDetailed(
        profile,
        viewerState,
        stats,
      );
    });
  }

  async findProfileView(
    dids: Did[],
  ): Promise<$Typed<AppBskyActorDefs.ProfileView>[]> {
    const profiles = await this.profileRepository.findManyDetailed(dids);
    return profiles.map((profile) =>
      this.profileViewBuilder.profileView(
        profile,
        this.profileViewBuilder.emptyViewerState(),
      ),
    );
  }
}
