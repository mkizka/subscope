import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { Record } from "@repo/common/domain";
import { validateRecord } from "@repo/common/utils";

import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class GateIndexer implements ICollectionIndexer {
  shouldIndex({ record }: { record: Record }) {
    const gate = validateRecord(
      record.uri.collection === "app.bsky.feed.threadgate"
        ? "app.bsky.feed.threadgate"
        : "app.bsky.feed.postgate",
      record,
    );
    const postUri = new AtUri(gate.post);
    return Promise.resolve(
      postUri.host === asDid(record.uri.host) &&
        postUri.collection === "app.bsky.feed.post" &&
        postUri.rkey === record.uri.rkey,
    );
  }

  upsert() {
    return Promise.resolve();
  }
}
