import type { TransactionContext } from "@repo/common/interface";

import { type Generator, parseGenerator } from "../../dto/generator.js";
import type { Record } from "../../dto/record.js";
import type { IGeneratorRepository } from "../../interfaces/repositories/generator-repository.js";
import type { ICollectionIndexer } from "./collection-indexer.js";

export class GeneratorIndexer implements ICollectionIndexer<Generator> {
  constructor(private readonly generatorRepository: IGeneratorRepository) {}

  parse(record: Record) {
    return parseGenerator(record);
  }

  async save({ ctx, parsed }: { ctx: TransactionContext; parsed: Generator }) {
    await this.generatorRepository.save({ ctx, generator: parsed });
  }
}
