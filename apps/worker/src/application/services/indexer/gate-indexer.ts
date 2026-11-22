import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "../../dto/record.js";
import type { ICollectionIndexer } from "./collection-indexer.js";

type Gate = { uri: AtUri; postUri: AtUri };

export class GateIndexer implements ICollectionIndexer<Gate> {
  parse(record: Record): Gate {
    return {
      uri: record.uri,
      postUri: new AtUri(
        validateRecord(
          record.uri.collection === "app.bsky.feed.threadgate"
            ? "app.bsky.feed.threadgate"
            : "app.bsky.feed.postgate",
          record,
        ).post,
      ),
    };
  }

  shouldStore({ parsed: { uri, postUri } }: { parsed: Gate }) {
    return (
      postUri.host === uri.did &&
      postUri.collection === "app.bsky.feed.post" &&
      postUri.rkey === uri.rkey
    );
  }
}
