import { validateRecord } from "@repo/common/utils";

import type { Record } from "../../dto/record.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class LinkIndexer implements ICollectionIndexer {
  upsert({ record }: { record: Record }) {
    validateRecord("app.bsky.actor.link", record);
    return Promise.resolve();
  }
}
