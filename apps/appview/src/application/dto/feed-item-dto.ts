import type { Did } from "@atproto/did";
import type { AtUriString } from "@atproto/syntax";

export type FeedItemDto = {
  uri: AtUriString;
  type: "post" | "repost";
  subjectUri: AtUriString | null;
  accountDid: Did;
  sortAt: Date;
};
