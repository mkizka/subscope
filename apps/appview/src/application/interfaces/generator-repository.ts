import type { AtUri } from "@atproto/syntax";
import type { Generator } from "@repo/common/domain";

export interface IGeneratorRepository {
  findByUris: (uris: AtUri[]) => Promise<Generator[]>;
}
