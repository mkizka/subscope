import type { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { Generator } from "@repo/common/domain";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type { IGeneratorRepository } from "../../application/interfaces/generator-repository.js";

export class GeneratorRepository implements IGeneratorRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findByUris(uris: AtUri[]): Promise<Generator[]> {
    if (uris.length === 0) {
      return [];
    }

    const uriStrings = uris.map((uri) => uri.toString());

    const results = await this.db
      .select()
      .from(schema.generators)
      .where(inArray(schema.generators.uri, uriStrings));

    return results.map(
      (result) =>
        new Generator({
          uri: result.uri,
          cid: result.cid,
          actorDid: result.actorDid,
          did: result.did,
          displayName: result.displayName,
          description: result.description || undefined,
          avatarCid: result.avatarCid || undefined,
          createdAt: result.createdAt,
          indexedAt: result.indexedAt,
        }),
    );
  }
}
