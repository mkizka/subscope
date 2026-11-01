import { AtUri } from "@atproto/syntax";
import type { Record } from "@repo/common/domain";

import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class GateIndexer implements ICollectionIndexer {
  shouldIndex({ record }: { record: Record }) {
    const gate = record.validate(
      record.collection === "app.bsky.feed.threadgate"
        ? "app.bsky.feed.threadgate"
        : "app.bsky.feed.postgate",
    );
    const postUri = new AtUri(gate.post);
    return Promise.resolve(
      postUri.host === record.actorDid &&
        postUri.collection === "app.bsky.feed.post" &&
        postUri.rkey === record.uri.rkey,
    );
  }

  upsert() {
    return Promise.resolve();
  }
}
