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

  get postUri() {
    return new AtUri(this.value.post);
  }

  get attachesToOwnPost() {
    return (
      this.postUri.host === this.uri.did &&
      this.postUri.collection === "app.bsky.feed.post" &&
      this.postUri.rkey === this.uri.rkey
    );
  }

  get replyRules() {
    return "allow" in this.value ? this.value.allow : undefined;
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
