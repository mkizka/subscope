import type { AfterCommitContext } from "@repo/common/interface";

import { List } from "../../../domain/list.js";
import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import type { IListRepository } from "../../interfaces/repositories/list-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";

export class ListIndexer implements IRecordIndexer {
  constructor(
    private readonly listRepository: IListRepository,
    private readonly recordSaveService: RecordSaveService,
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
    const list = List.fromRecord(record);
    await this.recordSaveService.save({ ctx, record, origin });
    await this.listRepository.save({ ctx, list });
  }
}
