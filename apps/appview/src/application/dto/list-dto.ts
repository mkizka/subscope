import type { Did } from "@atproto/did";
import type { AtUriString } from "@atproto/syntax";

export type ListDto = {
  uri: AtUriString;
  cid: string;
  actorDid: Did;
  name: string;
  purpose: string;
  description: string | null;
  avatarCid: string | null;
  createdAt: Date;
  indexedAt: Date;
};

export type ListItemDto = {
  uri: AtUriString;
  subjectDid: Did;
  createdAt: Date;
};
