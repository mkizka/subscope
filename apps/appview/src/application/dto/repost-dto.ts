import type { Did } from "@atproto/did";
import type { AtUriString } from "@atproto/syntax";

export type RepostDto = {
  uri: AtUriString;
  actorDid: Did;
  subjectUri: AtUriString;
  indexedAt: Date;
  sortAt: Date;
};
