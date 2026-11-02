import type { Did } from "@atproto/did";
import type { AtUriString } from "@atproto/syntax";

export type GeneratorDto = {
  uri: AtUriString;
  cid: string;
  accountDid: Did;
  did: Did;
  displayName: string;
  description: string | null;
  avatarCid: string | null;
  indexedAt: Date;
};
