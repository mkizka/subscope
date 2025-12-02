import type { Generator, TransactionContext } from "@repo/common/domain";
import { type GeneratorInsert, schema } from "@repo/db";

import type { IGeneratorRepository } from "../../../application/interfaces/repositories/generator-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class GeneratorRepository implements IGeneratorRepository {
  async upsert({
    ctx,
    generator,
  }: {
    ctx: TransactionContext;
    generator: Generator;
  }) {
    const data = {
      cid: generator.cid,
      actorDid: generator.actorDid,
      did: generator.did,
      displayName: generator.displayName,
      description: generator.description,
      avatarCid: generator.avatarCid,
      createdAt: sanitizeDate(generator.createdAt),
    } satisfies GeneratorInsert;
    await ctx.db
      .insert(schema.generators)
      .values({
        uri: generator.uri.toString(),
        indexedAt: generator.indexedAt,
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.generators.uri,
        set: data,
      });
  }
}
