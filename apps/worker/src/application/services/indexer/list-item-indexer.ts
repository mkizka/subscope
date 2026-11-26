import type { AfterCommitContext } from "@repo/common/interface";

import { ListItem } from "../../../domain/list-item.js";
import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import type { IListItemRepository } from "../../interfaces/repositories/list-item-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { IndexAccountService } from "../index-account-service.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";

export class ListItemIndexer implements IRecordIndexer {
  constructor(
    private readonly deps: {
      listItemRepository: IListItemRepository;
      indexAccountService: IndexAccountService;
      recordSaveService: RecordSaveService;
      relatedRecordService: RelatedRecordService;
    },
  ) {}

  async index({
    ctx,
    record,
    origin,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
  }) {
    const listItem = ListItem.fromRecord(record);

    await this.deps.recordSaveService.save({ ctx, record });
    await this.deps.relatedRecordService.requestFor({
      ctx,
      origin,
      record: listItem,
    });
    await this.deps.indexAccountService.upsert({
      ctx,
      did: listItem.subjectDid,
    });
    await this.deps.listItemRepository.save({ ctx, listItem });
  }
}
