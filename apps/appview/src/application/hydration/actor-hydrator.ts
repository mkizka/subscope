import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { ProfileDetailed } from "@repo/common/domain";

import type {
  ActorStats,
  IActorStatsRepository,
} from "../interfaces/actor-stats-repository.js";
import type { IFollowRepository } from "../interfaces/follow-repository.js";
import {
  type ILabelRepository,
  isTakendown,
} from "../interfaces/label-repository.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";

export type HydrateCtx = {
  viewerDid?: Did | null;
  includeTakedowns?: boolean;
};

export type ActorHydrationState = {
  profiles: Map<Did, ProfileDetailed>;
  following: Map<Did, AtUri>;
  followedBy: Map<Did, AtUri>;
  stats: Map<string, ActorStats>;
};

export class ActorHydrator {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly followRepository: IFollowRepository,
    private readonly labelRepository: ILabelRepository,
  ) {}

  async hydrateProfiles(
    dids: Did[],
    ctx: HydrateCtx = {},
  ): Promise<ActorHydrationState> {
    const profiles = await this.findVisibleProfiles(dids, ctx);
    const targetDids = [...profiles.keys()];
    const [following, followedBy] = ctx.viewerDid
      ? await Promise.all([
          this.followRepository.findFollowingMap({
            actorDid: ctx.viewerDid,
            targetDids,
          }),
          this.followRepository.findFollowedByMap({
            actorDid: ctx.viewerDid,
            targetDids,
          }),
        ])
      : [new Map<Did, AtUri>(), new Map<Did, AtUri>()];
    return { profiles, following, followedBy, stats: new Map() };
  }

  async hydrateProfilesDetailed(
    dids: Did[],
    ctx: HydrateCtx = {},
  ): Promise<ActorHydrationState> {
    const [state, stats] = await Promise.all([
      this.hydrateProfiles(dids, ctx),
      this.actorStatsRepository.findStats(dids),
    ]);
    return { ...state, stats };
  }

  private async findVisibleProfiles(dids: Did[], ctx: HydrateCtx) {
    const [profiles, labels] = await Promise.all([
      this.profileRepository.findManyDetailed(dids),
      ctx.includeTakedowns ? [] : this.labelRepository.findBySubjects(dids),
    ]);
    const labelMap = Map.groupBy(labels, (label) => label.uri);
    return new Map(
      profiles
        .filter((profile) => !isTakendown(labelMap.get(profile.actorDid)))
        .map((profile) => [profile.actorDid, profile]),
    );
  }
}
