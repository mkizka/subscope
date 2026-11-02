import type { Did } from "@atproto/did";
import type { AtUriString } from "@atproto/syntax";

export type FollowDto = {
  uri: AtUriString;
  actorDid: Did;
  subjectDid: Did;
};

export type FolloweeDto = {
  subjectDid: Did;
  sortAt: Date;
};

export type FollowerDto = {
  actorDid: Did;
  sortAt: Date;
};
