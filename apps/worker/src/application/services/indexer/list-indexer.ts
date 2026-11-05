import type { TransactionContext } from "@repo/common/interface";

import { parseList } from "../../dto/list.js";
import type { Record } from "../../dto/record.js";
import type { IListRepository } from "../../interfaces/repositories/list-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class ListIndexer implements ICollectionIndexer {
  constructor(private readonly listRepository: IListRepository) {}

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const list = parseList(record);
    await this.listRepository.save({ ctx, list });
  }
}
