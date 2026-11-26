import type { AfterCommitContext } from "@repo/common/interface";

import { ListItem } from "../../../domain/list-item.js";
import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { IListItemRepository } from "../../interfaces/repositories/list-item-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { IndexAccountService } from "../index-account-service.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";

export class ListItemIndexer implements IRecordIndexer {
  constructor(
    private readonly listItemRepository: IListItemRepository,
    private readonly storagePolicy: StoragePolicy,
    private readonly indexAccountService: IndexAccountService,
    private readonly recordSaveService: RecordSaveService,
    private readonly relatedRecordService: RelatedRecordService,
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

    await this.recordSaveService.save({ ctx, record, origin });
    await this.indexAccountService.upsert({ ctx, did: listItem.subjectDid });
    await this.listItemRepository.save({ ctx, listItem });

    const fetchesSubject = await this.storagePolicy.fetchesListItemSubject(
      ctx,
      listItem,
    );
    if (fetchesSubject) {
      await this.relatedRecordService.requestAccount({
        ctx,
        origin,
        did: listItem.subjectDid,
      });
    }
  }
}
