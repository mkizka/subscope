import type { AfterCommitContext } from "@repo/common/interface";

import type { Origin } from "../../../domain/origin.js";
import { parseGenerator } from "../../dto/generator.js";
import type { Record } from "../../dto/record.js";
import type { IGeneratorRepository } from "../../interfaces/repositories/generator-repository.js";
import type { IRecordIndexer } from "../../interfaces/services/record-indexer.js";
import type { RecordSaveService } from "../record-save-service.js";

export class GeneratorIndexer implements IRecordIndexer {
  constructor(
    private readonly generatorRepository: IGeneratorRepository,
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
    const generator = parseGenerator(record);
    await this.recordSaveService.save({ ctx, record, origin });
    await this.generatorRepository.save({ ctx, generator });
  }
}
