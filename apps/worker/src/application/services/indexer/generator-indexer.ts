import type { AfterCommitContext } from "@repo/common/interface";

import { Generator } from "../../../domain/generator.js";
import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { IGeneratorRepository } from "../../interfaces/repositories/generator-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";

export class GeneratorIndexer implements IRecordIndexer {
  constructor(
    private readonly deps: {
      generatorRepository: IGeneratorRepository;
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
    const generator = Generator.fromRecord(record);
    const saves = await this.deps.storagePolicy.saves({
      ctx,
      origin,
      record: {
        accountDid: record.uri.did,
        addresseeDids: [],
        reachesFollowers: false,
      },
    });
    if (!saves) {
      return false;
    }
    await this.deps.recordSaveService.save({ ctx, record });
    await this.deps.relatedRecordService.requestFor({
      ctx,
      origin,
      record: generator,
    });
    await this.deps.generatorRepository.save({ ctx, generator });
    return true;
  }
}
