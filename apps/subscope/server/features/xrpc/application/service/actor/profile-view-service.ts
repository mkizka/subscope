import { type Did } from "@atproto/did";
import type { $Typed, AppBskyActorDefs } from "@repo/client/server";
import type { ProfileDetailed } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import type { IActorStatsRepository } from "@/server/features/xrpc/application/interfaces/actor-stats-repository.js";
import type { IFollowRepository } from "@/server/features/xrpc/application/interfaces/follow-repository.js";
import type { IProfileRepository } from "@/server/features/xrpc/application/interfaces/profile-repository.js";

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

  async findProfileViewBasic(dids: Did[], viewerDid?: Did | null) {
    const profiles = await this.profileRepository.findManyDetailed(dids);
    const viewerStatesMap = await this.findViewerStates(profiles, viewerDid);

    return profiles.map((profile) =>
      this.profileViewBuilder.profileViewBasic(
        profile,
        required(viewerStatesMap.get(profile.actorDid)),
      ),
    );
  }

  async findProfileView(
    dids: Did[],
    viewerDid?: Did | null,
  ): Promise<$Typed<AppBskyActorDefs.ProfileView>[]> {
    const profiles = await this.profileRepository.findManyDetailed(dids);
    const viewerStatesMap = await this.findViewerStates(profiles, viewerDid);

    return profiles.map((profile) =>
      this.profileViewBuilder.profileView(
        profile,
        required(viewerStatesMap.get(profile.actorDid)),
      ),
    );
  }

  async findProfileViewDetailed(
    dids: Did[],
    viewerDid?: Did | null,
  ): Promise<$Typed<AppBskyActorDefs.ProfileViewDetailed>[]> {
    const profiles = await this.profileRepository.findManyDetailed(dids);
    const viewerStatesMap = await this.findViewerStates(profiles, viewerDid);
    const statsMap = await this.actorStatsRepository.findStats(dids);

    return profiles.map((profile) => {
      return this.profileViewBuilder.profileViewDetailed(
        profile,
        required(viewerStatesMap.get(profile.actorDid)),
        statsMap.get(profile.actorDid),
      );
    });
  }

  private async findViewerStates(
    profiles: ProfileDetailed[],
    viewerDid?: Did | null,
  ): Promise<Map<Did, $Typed<AppBskyActorDefs.ViewerState>>> {
    const viewerStatesMap = new Map<
      Did,
      $Typed<AppBskyActorDefs.ViewerState>
    >();

    if (!viewerDid) {
      for (const profile of profiles) {
        viewerStatesMap.set(
          profile.actorDid,
          this.profileViewBuilder.emptyViewerState(),
        );
      }
      return viewerStatesMap;
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

    for (const profile of profiles) {
      const viewerState = this.profileViewBuilder.viewerState(
        profile.actorDid,
        followingMap,
        followedByMap,
      );
      viewerStatesMap.set(profile.actorDid, viewerState);
    }

    return viewerStatesMap;
  }
}
