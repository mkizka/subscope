import type { Did } from "@atproto/did";

export type ListItemDto = {
  uri: string;
  listUri: string;
  subjectDid: Did;
};
