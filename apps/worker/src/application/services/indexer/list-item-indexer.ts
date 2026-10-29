import type { Record, TransactionContext } from "@repo/common/domain";
import { ListItem } from "@repo/common/domain";

import type { IListItemRepository } from "../../interfaces/repositories/list-item-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { IndexActorService } from "../index-actor-service.js";

export class ListItemIndexer implements ICollectionIndexer {
  constructor(
    private readonly listItemRepository: IListItemRepository,
    private readonly indexActorService: IndexActorService,
  ) {}

  async upsert({
    ctx,
    record,
    live,
  }: {
    ctx: TransactionContext;
    record: Record;
    live: boolean;
  }) {
    const listItem = ListItem.from(record);
    await this.indexActorService.upsert({
      ctx,
      did: listItem.subjectDid,
      live,
    });
    await this.listItemRepository.upsert({ ctx, listItem });
  }
}
