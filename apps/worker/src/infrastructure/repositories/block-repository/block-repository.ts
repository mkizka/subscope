import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";

import type { Block } from "../../../application/dto/block.js";
import type { IBlockRepository } from "../../../application/interfaces/repositories/block-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class BlockRepository implements IBlockRepository {
  async save({ ctx, block }: { ctx: TransactionContext; block: Block }) {
    const { uri, indexedAt, ...rest } = block;
    const data = {
      ...rest,
      createdAt: sanitizeDate(rest.createdAt),
    };
    await ctx.db
      .insert(schema.blocks)
      .values({ uri, indexedAt, ...data })
      .onConflictDoUpdate({ target: schema.blocks.uri, set: data });
  }
}
