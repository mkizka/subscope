import type { AfterCommitContext } from "@repo/common/interface";

import { Gate } from "../../../domain/gate.js";
import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import type { IRecordQuery } from "../../interfaces/queries/record-query.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";

export class GateIndexer implements IRecordIndexer {
  constructor(
    private readonly deps: {
      recordQuery: IRecordQuery;
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
    const gate = Gate.fromRecord(record);
    if (!gate.attachesToOwnPost) {
      return false;
    }
    const postSaved = await this.deps.recordQuery.exists(ctx, gate.postUri);
    if (!postSaved) {
      return false;
    }
    await this.deps.recordSaveService.save({ ctx, record });
    await this.deps.relatedRecordService.requestFor({
      ctx,
      origin,
      record: { accountDid: record.uri.did },
    });
    return true;
  }
}
