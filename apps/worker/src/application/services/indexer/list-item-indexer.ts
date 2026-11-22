import type { AfterCommitContext } from "@repo/common/interface";

import { parseListItem } from "../../dto/list-item.js";
import type { Record } from "../../dto/record.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { IListItemRepository } from "../../interfaces/repositories/list-item-repository.js";
import type {
  ICollectionIndexer,
  Indexing,
} from "../../interfaces/services/index-collection-service.js";
import type { IndexAccountService } from "../index-account-service.js";

export class ListItemIndexer implements ICollectionIndexer {
  constructor(
    private readonly listItemRepository: IListItemRepository,
    private readonly indexAccountService: IndexAccountService,
    private readonly registrationQuery: IRegistrationQuery,
  ) {}

  async upsert({
    ctx,
    record,
    indexing,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    indexing: Indexing;
  }) {
    const listItem = parseListItem(record);
    await this.indexAccountService.upsert({
      ctx,
      did: listItem.subjectDid,
      live: indexing.live,
      fetchMissing: await this.registrationQuery.isRegistered(
        ctx,
        listItem.accountDid,
      ),
    });
    await this.listItemRepository.save({ ctx, listItem });
  }
}
