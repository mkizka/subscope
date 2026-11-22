import type { TransactionContext } from "@repo/common/interface";

import { type List, parseList } from "../../dto/list.js";
import type { Record } from "../../dto/record.js";
import type { IListRepository } from "../../interfaces/repositories/list-repository.js";
import type { ICollectionIndexer } from "./collection-indexer.js";

export class ListIndexer implements ICollectionIndexer<List> {
  constructor(private readonly listRepository: IListRepository) {}

  parse(record: Record) {
    return parseList(record);
  }

  async save({ ctx, parsed }: { ctx: TransactionContext; parsed: List }) {
    await this.listRepository.save({ ctx, list: parsed });
  }
}
