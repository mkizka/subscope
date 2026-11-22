import type { TransactionContext } from "@repo/common/interface";

import type { Author } from "../../dto/author.js";
import { type ListItem, parseListItem } from "../../dto/list-item.js";
import type { Record } from "../../dto/record.js";
import type { IListItemRepository } from "../../interfaces/repositories/list-item-repository.js";
import type { IndexAccountService } from "../index-account-service.js";
import type { ICollectionIndexer } from "./collection-indexer.js";

export class ListItemIndexer implements ICollectionIndexer<ListItem> {
  constructor(
    private readonly listItemRepository: IListItemRepository,
    private readonly indexAccountService: IndexAccountService,
  ) {}

  parse(record: Record) {
    return parseListItem(record);
  }

  async save({ ctx, parsed }: { ctx: TransactionContext; parsed: ListItem }) {
    await this.indexAccountService.upsert({ ctx, did: parsed.subjectDid });
    await this.listItemRepository.save({ ctx, listItem: parsed });
  }

  accountsToFetch({ parsed, author }: { parsed: ListItem; author: Author }) {
    return author.isMember ? [parsed.subjectDid] : [];
  }
}
