import type { AfterCommitContext } from "@repo/common/interface";

import { parseListItem } from "../../dto/list-item.js";
import type { Record } from "../../dto/record.js";
import type { IListItemRepository } from "../../interfaces/repositories/list-item-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { IndexAccountService } from "../index-account-service.js";

export class ListItemIndexer implements ICollectionIndexer {
  constructor(
    private readonly listItemRepository: IListItemRepository,
    private readonly indexAccountService: IndexAccountService,
  ) {}

  async upsert({ ctx, record }: { ctx: AfterCommitContext; record: Record }) {
    const listItem = parseListItem(record);
    await this.indexAccountService.upsert({ ctx, did: listItem.subjectDid });
    await this.listItemRepository.save({ ctx, listItem });
  }
}
