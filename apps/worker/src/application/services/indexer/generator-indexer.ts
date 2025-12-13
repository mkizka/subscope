import type { Record, TransactionContext } from "@repo/common/domain";
import { Generator } from "@repo/common/domain";

import type { GeneratorIndexingPolicy } from "../../../domain/indexing-policy/generator-indexing-policy.js";
import type { IGeneratorRepository } from "../../interfaces/repositories/generator-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class GeneratorIndexer implements ICollectionIndexer {
  constructor(
    private readonly generatorRepository: IGeneratorRepository,
    private readonly generatorIndexingPolicy: GeneratorIndexingPolicy,
  ) {}
  static inject = ["generatorRepository", "generatorIndexingPolicy"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const generator = Generator.from(record);
    await this.generatorRepository.upsert({ ctx, generator });
  }

  async shouldIndex({
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const generator = Generator.from(record);
    return await this.generatorIndexingPolicy.shouldIndex(generator);
  }
}
