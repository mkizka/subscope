import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class GateIndexer implements ICollectionIndexer {
  upsert() {
    return Promise.resolve();
  }
}
