import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import { Profile } from "../../../domain/profile.js";
import type { Record } from "../../../domain/record.js";
import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { IProfileRepository } from "../../interfaces/repositories/profile-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";

export class ProfileIndexer implements IRecordIndexer {
  constructor(
    private readonly deps: {
      profileRepository: IProfileRepository;
      storagePolicy: StoragePolicy;
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
    const profile = Profile.fromRecord(record);
    const saves = await this.deps.storagePolicy.saves({
      ctx,
      origin,
      record: { accountDid: record.uri.did, addresseeDids: [] },
    });
    if (!saves) {
      return;
    }
    await this.deps.recordSaveService.save({ ctx, record });
    await this.deps.relatedRecordService.requestFor({
      ctx,
      origin,
      record: profile,
    });
    await this.deps.profileRepository.save({ ctx, profile });
  }
}
