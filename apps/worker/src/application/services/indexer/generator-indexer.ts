import type { Record, TransactionContext } from "@repo/common/domain";
import { Generator } from "@repo/common/domain";

import type { IGeneratorRepository } from "../../interfaces/repositories/generator-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class GeneratorIndexer implements ICollectionIndexer {
  constructor(private readonly generatorRepository: IGeneratorRepository) {}
  static inject = ["generatorRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const generator = Generator.from(record);
    await this.generatorRepository.upsert({ ctx, generator });
  }
}
