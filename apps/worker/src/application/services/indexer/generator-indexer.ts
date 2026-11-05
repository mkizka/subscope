import type { TransactionContext } from "@repo/common/interface";

import { parseGenerator } from "../../dto/generator.js";
import type { Record } from "../../dto/record.js";
import type { IGeneratorRepository } from "../../interfaces/repositories/generator-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class GeneratorIndexer implements ICollectionIndexer {
  constructor(private readonly generatorRepository: IGeneratorRepository) {}

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const generator = parseGenerator(record);
    await this.generatorRepository.save({ ctx, generator });
  }
}
