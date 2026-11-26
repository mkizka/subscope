import type { AfterCommitContext } from "@repo/common/interface";

import { Generator } from "../../../domain/generator.js";
import type { Origin } from "../../../domain/origin.js";
import type { Record } from "../../../domain/record.js";
import type { IGeneratorRepository } from "../../interfaces/repositories/generator-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";
import type { RelatedRecordService } from "../related-record-service.js";

export class GeneratorIndexer implements IRecordIndexer {
  constructor(
    private readonly generatorRepository: IGeneratorRepository,
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
    const generator = Generator.fromRecord(record);
    await this.recordSaveService.save({ ctx, record });
    await this.relatedRecordService.requestFor({
      ctx,
      origin,
      record: generator,
    });
    await this.generatorRepository.save({ ctx, generator });
  }
}
