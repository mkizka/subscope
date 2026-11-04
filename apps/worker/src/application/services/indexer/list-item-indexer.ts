import type { AfterCommitContext } from "@repo/common/domain";

import type { IListItemRepository } from "../../interfaces/repositories/list-item-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import { parseListItem } from "../../models/list-item.js";
import type { Record } from "../../models/record.js";
import type { IndexAccountService } from "../index-account-service.js";

export class ListItemIndexer implements ICollectionIndexer {
  constructor(
    private readonly listItemRepository: IListItemRepository,
    private readonly indexAccountService: IndexAccountService,
  ) {}

  async upsert({
    ctx,
    record,
    live,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    live: boolean;
  }) {
    const listItem = parseListItem(record);
    await this.indexAccountService.upsert({
      ctx,
      did: listItem.subjectDid,
      live,
    });
    await this.listItemRepository.save({ ctx, listItem });
  }
}
