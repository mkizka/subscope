import type { Did } from "@atproto/did";

import type { FollowDto, FolloweeDto, FollowerDto } from "../dto/follow-dto.js";

export interface IFollowQuery {
  findFollows: (params: {
    actorDids: Did[];
    subjectDids: Did[];
  }) => Promise<FollowDto[]>;
  findActorFollows: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<FolloweeDto[]>;
  findActorFollowers: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<FollowerDto[]>;
  findFolloweeDids: (actorDid: Did) => Promise<Did[]>;
}
