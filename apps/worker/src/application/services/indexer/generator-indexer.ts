import type { TransactionContext } from "@repo/common/domain";

import type { IGeneratorRepository } from "../../interfaces/repositories/generator-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { Record } from "../../models/record.js";
import { parseGenerator } from "../../record-parsers.js";

export class GeneratorIndexer implements ICollectionIndexer {
  constructor(private readonly generatorRepository: IGeneratorRepository) {}

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const generator = parseGenerator(record);
    await this.generatorRepository.save({ ctx, generator });
  }
}
