import type { TransactionContext } from "@repo/common/domain";

import type { IGeneratorRepository } from "../../../application/interfaces/repositories/generator-repository.js";
import type { GeneratorRow } from "../../../application/record-parsers.js";

export class InMemoryGeneratorRepository implements IGeneratorRepository {
  private generators: Map<string, GeneratorRow> = new Map();

  add(generator: GeneratorRow): void {
    this.generators.set(generator.uri, generator);
  }

  clear(): void {
    this.generators.clear();
  }

  async save({
    generator,
  }: {
    ctx: TransactionContext;
    generator: GeneratorRow;
  }): Promise<void> {
    this.generators.set(generator.uri, generator);
  }
}
