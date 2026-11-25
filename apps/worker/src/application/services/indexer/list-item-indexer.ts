import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import { parseListItem } from "../../dto/list-item.js";
import type { Record } from "../../dto/record.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { IListItemRepository } from "../../interfaces/repositories/list-item-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { IndexAccountService } from "../index-account-service.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";

export class ListItemIndexer implements IRecordIndexer {
  constructor(
    private readonly listItemRepository: IListItemRepository,
    private readonly registrationQuery: IRegistrationQuery,
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
    const listItem = parseListItem(record);

    await this.recordSaveService.save({ ctx, record, origin });
    await this.indexAccountService.upsert({ ctx, did: listItem.subjectDid });
    await this.listItemRepository.save({ ctx, listItem });

    const isOwnerMember = await this.registrationQuery.isRegistered(
      ctx,
      listItem.accountDid,
    );
    if (isOwnerMember) {
      await this.relatedRecordService.requestAccount({
        ctx,
        origin,
        did: listItem.subjectDid,
      });
    }
  }
}
