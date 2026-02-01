import type { AtUri } from "@atproto/syntax";
import type { Generator } from "@repo/common/domain";

import type { IGeneratorRepository } from "@/server/features/xrpc/application/interfaces/generator-repository.js";

export class InMemoryGeneratorRepository implements IGeneratorRepository {
  private generators: Map<string, Generator> = new Map();

  add(generator: Generator): void {
    this.generators.set(generator.uri.toString(), generator);
  }

  clear(): void {
    this.generators.clear();
  }

  findByUris(uris: AtUri[]): Promise<Generator[]> {
    const result: Generator[] = [];

    for (const uri of uris) {
      const uriStr = uri.toString();
      const generator = this.generators.get(uriStr);
      if (generator) {
        result.push(generator);
      }
    }

    return Promise.resolve(result);
  }
}
