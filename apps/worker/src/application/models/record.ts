import type { AtUri } from "@atproto/syntax";

export type Record = {
  uri: AtUri;
  cid: string;
  json: unknown;
  indexedAt: Date;
};
