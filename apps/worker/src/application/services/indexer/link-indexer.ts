import type { AfterCommitContext } from "@repo/common/interface";
import { validateRecord } from "@repo/common/utils";

import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";

export class LinkIndexer implements IRecordIndexer {
  constructor(
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
    validateRecord("app.bsky.actor.link", record);
    await this.recordSaveService.save({ ctx, record });
    await this.relatedRecordService.requestFor({
      ctx,
      origin,
      record: { accountDid: record.uri.did },
    });
  }
}
