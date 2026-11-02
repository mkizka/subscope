import type { Did } from "@atproto/did";
import type { Follow } from "@repo/common/domain";

import type { FollowDto } from "../dto/follow-dto.js";

export interface IFollowQuery {
  findFollows: (params: {
    actorDids: Did[];
    subjectDids: Did[];
  }) => Promise<FollowDto[]>;
  findActorFollows: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<Follow[]>;
  findActorFollowers: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<Follow[]>;
  findFolloweeDids: (actorDid: Did) => Promise<Did[]>;
}
