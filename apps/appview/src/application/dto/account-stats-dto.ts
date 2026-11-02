import type { Did } from "@atproto/did";

export type AccountStatsDto = {
  accountDid: Did;
  followsCount: number;
  followersCount: number;
  postsCount: number;
};
