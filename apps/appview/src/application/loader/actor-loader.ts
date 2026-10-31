import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { ProfileDetailed } from "@repo/common/domain";

import type { ActorStatsDto } from "../dto/actor-stats-dto.js";
import type { IActorStatsQuery } from "../interfaces/actor-stats-query.js";
import type { IFollowRepository } from "../interfaces/follow-repository.js";
import type {
  ILabelRepository,
  Label,
} from "../interfaces/label-repository.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";

export type ViewData = {
  profiles: Map<Did, ProfileDetailed>;
  following: Map<Did, AtUri>;
  followedBy: Map<Did, AtUri>;
  actorStats: Map<Did, ActorStatsDto>;
  labels: Map<string, Label[]>;
};

export class ActorLoader {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly actorStatsQuery: IActorStatsQuery,
    private readonly followRepository: IFollowRepository,
    private readonly labelRepository: ILabelRepository,
  ) {}

  async loadProfiles(dids: Did[], viewerDid?: Did | null): Promise<ViewData> {
    const [profiles, labels, following, followedBy] = await Promise.all([
      this.profileRepository.findManyDetailed(dids),
      this.labelRepository.findBySubjects(dids),
      viewerDid
        ? this.followRepository.findFollowingMap({
            actorDid: viewerDid,
            targetDids: dids,
          })
        : new Map<Did, AtUri>(),
      viewerDid
        ? this.followRepository.findFollowedByMap({
            actorDid: viewerDid,
            targetDids: dids,
          })
        : new Map<Did, AtUri>(),
    ]);
    return {
      profiles: new Map(profiles.map((profile) => [profile.actorDid, profile])),
      following,
      followedBy,
      actorStats: new Map(),
      labels: Map.groupBy(labels, (label) => label.uri),
    };
  }

  async loadProfilesDetailed(
    dids: Did[],
    viewerDid?: Did | null,
  ): Promise<ViewData> {
    const [data, actorStats] = await Promise.all([
      this.loadProfiles(dids, viewerDid),
      this.actorStatsQuery.findStats(dids),
    ]);
    return {
      ...data,
      actorStats: new Map(actorStats.map((stats) => [stats.actorDid, stats])),
    };
  }
}
