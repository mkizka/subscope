import type { Record } from "@repo/common/domain";

import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class LinkIndexer implements ICollectionIndexer {
  upsert({ record }: { record: Record }) {
    record.validate("app.bsky.actor.link");
    return Promise.resolve();
  }
}
