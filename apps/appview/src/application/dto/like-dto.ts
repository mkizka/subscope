import type { Did } from "@atproto/did";
import type { AtUriString } from "@atproto/syntax";

export type LikeDto = {
  uri: AtUriString;
  subjectUri: AtUriString;
};

export type SubjectLikeDto = {
  actorDid: Did;
  createdAt: Date;
  sortAt: Date;
};
