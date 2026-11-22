import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export function getGatedPostUri(record: Record): AtUri | null {
  const gate = validateRecord(
    record.uri.collection === "app.bsky.feed.threadgate"
      ? "app.bsky.feed.threadgate"
      : "app.bsky.feed.postgate",
    record,
  );
  const postUri = new AtUri(gate.post);
  const isSamePost =
    postUri.host === record.uri.did &&
    postUri.collection === "app.bsky.feed.post" &&
    postUri.rkey === record.uri.rkey;
  return isSamePost ? postUri : null;
}
