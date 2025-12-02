import type { Generator, TransactionContext } from "@repo/common/domain";

import type { IGeneratorRepository } from "../../../application/interfaces/repositories/generator-repository.js";

export class InMemoryGeneratorRepository implements IGeneratorRepository {
  private generators: Map<string, Generator> = new Map();

  add(generator: Generator): void {
    this.generators.set(generator.uri.toString(), generator);
  }

  clear(): void {
    this.generators.clear();
  }

  async upsert({
    generator,
  }: {
    ctx: TransactionContext;
    generator: Generator;
  }): Promise<void> {
    this.generators.set(generator.uri.toString(), generator);
  }
}
