import { type Did } from "@atproto/did";
import type * as AppBskyActorDefs from "@repo/client/lex/app/bsky/actor/defs";
import type { ProfileDetailed } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import type { IActorStatsRepository } from "../../../application/interfaces/actor-stats-repository.js";
import type { IFollowRepository } from "../../../application/interfaces/follow-repository.js";
import {
  type ILabelRepository,
  isTakendown,
} from "../../../application/interfaces/label-repository.js";
import type { IProfileRepository } from "../../../application/interfaces/profile-repository.js";
import type { ProfileViewBuilder } from "./profile-view-builder.js";

export class ProfileViewService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly followRepository: IFollowRepository,
    private readonly profileViewBuilder: ProfileViewBuilder,
    private readonly labelRepository: ILabelRepository,
  ) {}

  private async findProfiles(dids: Did[], includeTakedowns = false) {
    const [profiles, labels] = await Promise.all([
      this.profileRepository.findManyDetailed(dids),
      includeTakedowns ? [] : this.labelRepository.findBySubjects(dids),
    ]);
    const labelMap = Map.groupBy(labels, (label) => label.uri);
    return profiles.filter(
      (profile) => !isTakendown(labelMap.get(profile.actorDid)),
    );
  }

  async findProfileViewBasic(dids: Did[], viewerDid?: Did | null) {
    const profiles = await this.findProfiles(dids);
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
    { includeTakedowns = false } = {},
  ): Promise<AppBskyActorDefs.ProfileView[]> {
    const profiles = await this.findProfiles(dids, includeTakedowns);
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
  ): Promise<AppBskyActorDefs.ProfileViewDetailed[]> {
    const profiles = await this.findProfiles(dids);
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
  ): Promise<Map<Did, AppBskyActorDefs.ViewerState>> {
    const viewerStatesMap = new Map<Did, AppBskyActorDefs.ViewerState>();

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
