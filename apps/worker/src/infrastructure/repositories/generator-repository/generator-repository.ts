import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";

import type { Generator } from "../../../application/dto/generator.js";
import type { IGeneratorRepository } from "../../../application/interfaces/repositories/generator-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class GeneratorRepository implements IGeneratorRepository {
  async save({
    ctx,
    generator,
  }: {
    ctx: TransactionContext;
    generator: Generator;
  }) {
    const { uri, indexedAt, ...rest } = generator;
    const data = {
      ...rest,
      createdAt: sanitizeDate(rest.createdAt),
    };
    await ctx.db
      .insert(schema.generators)
      .values({ uri, indexedAt, ...data })
      .onConflictDoUpdate({ target: schema.generators.uri, set: data });
  }
}
