import type { AfterCommitContext } from "@repo/common/interface";

import { Gate } from "../../../domain/gate.js";
import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";

export class GateIndexer implements IRecordIndexer {
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
    const gate = Gate.fromRecord(record);
    if (!gate.attachesToOwnPost) {
      return;
    }
    await this.recordSaveService.save({ ctx, record, origin });
  }
}
