import type { Did } from "@atproto/did";
import type { AtUriString } from "@atproto/syntax";

export type BlockDto = {
  uri: AtUriString;
  accountDid: Did;
  subjectDid: Did;
};
