import type { AtUri } from "@atproto/syntax";

import type { GeneratorDto } from "../../application/dto/generator-dto.js";
import type { IGeneratorQuery } from "../../application/interfaces/generator-query.js";

export class InMemoryGeneratorQuery implements IGeneratorQuery {
  private generators: Map<string, GeneratorDto> = new Map();

  add(generator: GeneratorDto): void {
    this.generators.set(generator.uri, generator);
  }

  clear(): void {
    this.generators.clear();
  }

  findByUris(uris: AtUri[]): Promise<GeneratorDto[]> {
    return Promise.resolve(
      uris.flatMap((uri) => this.generators.get(uri.toString()) ?? []),
    );
  }
}
