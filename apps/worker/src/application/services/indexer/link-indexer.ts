import { validateRecord } from "@repo/common/utils";

import type { Record } from "../../dto/record.js";
import type { ICollectionIndexer } from "./collection-indexer.js";

export class LinkIndexer implements ICollectionIndexer<unknown> {
  parse(record: Record) {
    return validateRecord("app.bsky.actor.link", record);
  }
}
