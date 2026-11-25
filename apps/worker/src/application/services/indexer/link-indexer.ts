import type { AfterCommitContext } from "@repo/common/interface";
import { validateRecord } from "@repo/common/utils";

import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../dto/record.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";

export class LinkIndexer implements IRecordIndexer {
  constructor(private readonly recordSaveService: RecordSaveService) {}

  async index({
    ctx,
    record,
    origin,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
  }) {
    validateRecord("app.bsky.actor.link", record);
    await this.recordSaveService.save({ ctx, record, origin });
  }
}
