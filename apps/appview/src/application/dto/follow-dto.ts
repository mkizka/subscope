import type { Did } from "@atproto/did";
import type { AtUriString } from "@atproto/syntax";

export type FollowDto = {
  uri: AtUriString;
  accountDid: Did;
  subjectDid: Did;
};

export type FolloweeDto = {
  subjectDid: Did;
  sortAt: Date;
};

export type FollowerDto = {
  accountDid: Did;
  sortAt: Date;
};
