import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../domain/origin.js";
import type { Record } from "../dto/record.js";
import type { IRecordRepository } from "../interfaces/repositories/record-repository.js";
import type { IndexAccountService } from "./index-account-service.js";
import type { RelatedRecordService } from "./related-record-service.js";

export class RecordSaveService {
  constructor(
    private readonly recordRepository: IRecordRepository,
    private readonly indexAccountService: IndexAccountService,
    private readonly relatedRecordService: RelatedRecordService,
  ) {}

  async save({
    ctx,
    record,
    origin,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
  }) {
    const did = record.uri.did;
    await this.indexAccountService.upsert({ ctx, did });
    await this.relatedRecordService.requestAccount({ ctx, origin, did });
    await this.recordRepository.save({ ctx, record });
  }
}
