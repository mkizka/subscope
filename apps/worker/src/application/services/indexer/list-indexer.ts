import type { Record, TransactionContext } from "@repo/common/domain";
import { List } from "@repo/common/domain";

import type { IListRepository } from "../../interfaces/repositories/list-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class ListIndexer implements ICollectionIndexer {
  constructor(private readonly listRepository: IListRepository) {}
  static inject = ["listRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const list = List.from(record);
    await this.listRepository.upsert({ ctx, list });
  }
}
