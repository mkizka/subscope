import type { TransactionContext } from "@repo/common/domain";

import type { IGeneratorRepository } from "../../../application/interfaces/repositories/generator-repository.js";
import type { Generator } from "../../../application/models/generator.js";

export class InMemoryGeneratorRepository implements IGeneratorRepository {
  private generators: Map<string, Generator> = new Map();

  add(generator: Generator): void {
    this.generators.set(generator.uri, generator);
  }

  clear(): void {
    this.generators.clear();
  }

  async save({
    generator,
  }: {
    ctx: TransactionContext;
    generator: Generator;
  }): Promise<void> {
    this.generators.set(generator.uri, generator);
  }
}
