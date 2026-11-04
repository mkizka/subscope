import type { TransactionContext } from "@repo/common/domain";

import type { IListRepository } from "../../interfaces/repositories/list-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { Record } from "../../models/record.js";
import { parseList } from "../../record-parsers.js";

export class ListIndexer implements ICollectionIndexer {
  constructor(private readonly listRepository: IListRepository) {}

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const list = parseList(record);
    await this.listRepository.save({ ctx, list });
  }
}
