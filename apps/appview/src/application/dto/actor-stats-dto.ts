import type { Did } from "@atproto/did";

export type ActorStatsDto = {
  actorDid: Did;
  followsCount: number;
  followersCount: number;
  postsCount: number;
};
