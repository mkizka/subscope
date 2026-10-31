import type { AtUri } from "@atproto/syntax";

import type { GeneratorDto } from "../dto/generator-dto.js";

export interface IGeneratorQuery {
  findByUris: (uris: AtUri[]) => Promise<GeneratorDto[]>;
}
