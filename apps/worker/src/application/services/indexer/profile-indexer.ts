import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import { Profile } from "../../../domain/profile.js";
import type { Record } from "../../../domain/record.js";
import type { IProfileRepository } from "../../interfaces/repositories/profile-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";

export class ProfileIndexer implements IRecordIndexer {
  constructor(
    private readonly profileRepository: IProfileRepository,
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
    const profile = Profile.fromRecord(record);
    await this.recordSaveService.save({ ctx, record });
    await this.relatedRecordService.requestFor({
      ctx,
      origin,
      record: profile,
    });
    await this.profileRepository.save({ ctx, profile });
  }
}
