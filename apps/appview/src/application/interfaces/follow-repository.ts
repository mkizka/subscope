import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { Follow } from "@repo/common/domain";

export interface IFollowRepository {
  findFollows: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<Follow[]>;
  findFollowers: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<Follow[]>;
  findFollowingMap: (params: {
    actorDid: Did;
    targetDids: Did[];
  }) => Promise<Map<Did, AtUri>>;
  findFollowedByMap: (params: {
    actorDid: Did;
    targetDids: Did[];
  }) => Promise<Map<Did, AtUri>>;
}
