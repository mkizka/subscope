import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

const parseGate = (record: Record) =>
  validateRecord(
    record.uri.collection === "app.bsky.feed.threadgate"
      ? "app.bsky.feed.threadgate"
      : "app.bsky.feed.postgate",
    record,
  );

export class Gate {
  private constructor(
    private readonly uri: AtUri,
    private readonly value: ReturnType<typeof parseGate>,
  ) {}

  static fromRecord(record: Record) {
    return new Gate(record.uri, parseGate(record));
  }

  get attachesToOwnPost() {
    const postUri = new AtUri(this.value.post);
    return (
      postUri.host === this.uri.did &&
      postUri.collection === "app.bsky.feed.post" &&
      postUri.rkey === this.uri.rkey
    );
  }

  get disablesEmbedding() {
    return (
      "embeddingRules" in this.value &&
      !!this.value.embeddingRules?.some(
        (rule) => rule.$type === "app.bsky.feed.postgate#disableRule",
      )
    );
  }
}
