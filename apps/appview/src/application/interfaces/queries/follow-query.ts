import type { Did } from "@atproto/did";

import type {
  FollowDto,
  FolloweeDto,
  FollowerDto,
} from "../../dto/follow-dto.js";

export interface IFollowQuery {
  findFollows: (params: {
    accountDids: Did[];
    subjectDids: Did[];
  }) => Promise<FollowDto[]>;
  findAccountFollows: (params: {
    accountDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<FolloweeDto[]>;
  findAccountFollowers: (params: {
    accountDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<FollowerDto[]>;
  findKnownFollowers: (params: {
    viewerDid: Did;
    subjectDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<FollowerDto[]>;
  findFolloweeDids: (accountDid: Did) => Promise<Did[]>;
}
