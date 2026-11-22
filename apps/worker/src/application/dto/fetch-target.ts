import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

export type FetchTarget =
  { type: "record"; uri: AtUri; hop: number } | { type: "handle"; did: Did };
