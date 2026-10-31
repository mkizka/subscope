import type { Did } from "@atproto/did";

import type { FollowDto } from "../dto/follow-dto.js";

export interface IFollowQuery {
  findFollows: (params: {
    actorDids: Did[];
    subjectDids: Did[];
  }) => Promise<FollowDto[]>;
}
