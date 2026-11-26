import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export class Gate {
  private constructor(
    private readonly uri: AtUri,
    private readonly postUri: AtUri,
  ) {}

  static fromRecord(record: Record) {
    const parsed = validateRecord(
      record.uri.collection === "app.bsky.feed.threadgate"
        ? "app.bsky.feed.threadgate"
        : "app.bsky.feed.postgate",
      record,
    );
    return new Gate(record.uri, new AtUri(parsed.post));
  }

  get attachesToOwnPost() {
    return (
      this.postUri.host === this.uri.did &&
      this.postUri.collection === "app.bsky.feed.post" &&
      this.postUri.rkey === this.uri.rkey
    );
  }
}
