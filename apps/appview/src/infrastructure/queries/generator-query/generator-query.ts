import { asDid } from "@atproto/did";
import { asAtUriString, type AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type { GeneratorDto } from "../../../application/dto/generator-dto.js";
import type { IGeneratorQuery } from "../../../application/interfaces/queries/generator-query.js";

export class GeneratorQuery implements IGeneratorQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findByUris(uris: AtUri[]): Promise<GeneratorDto[]> {
    if (uris.length === 0) {
      return [];
    }
    const generators = await this.db
      .select()
      .from(schema.generators)
      .where(
        inArray(
          schema.generators.uri,
          uris.map((uri) => uri.toString()),
        ),
      );
    return generators.map((generator) => ({
      uri: asAtUriString(generator.uri),
      cid: generator.cid,
      actorDid: asDid(generator.actorDid),
      did: asDid(generator.did),
      displayName: generator.displayName,
      description: generator.description || null,
      avatarCid: generator.avatarCid || null,
      indexedAt: generator.indexedAt,
    }));
  }
}
