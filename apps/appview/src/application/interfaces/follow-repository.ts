import type { Did } from "@atproto/did";
import type { Follow } from "@repo/common/domain";

export interface IFollowRepository {
  findFollows: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<Follow[]>;
}
