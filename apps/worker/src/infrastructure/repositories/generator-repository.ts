import type { Generator, TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { IGeneratorRepository } from "../../application/interfaces/repositories/generator-repository.js";

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
      createdAt: generator.createdAt,
    };
    await ctx.db
      .insert(schema.generators)
      .values({
        uri: generator.uri.toString(),
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.generators.uri,
        set: data,
      });
  }
}
