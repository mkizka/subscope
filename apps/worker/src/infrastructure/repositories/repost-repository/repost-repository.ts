import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";

import type { Repost } from "../../../application/dto/repost.js";
import type { IRepostRepository } from "../../../application/interfaces/repositories/repost-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class RepostRepository implements IRepostRepository {
  async save({ ctx, repost }: { ctx: TransactionContext; repost: Repost }) {
    const { uri, indexedAt, ...rest } = repost;
    const data = {
      ...rest,
      createdAt: sanitizeDate(rest.createdAt),
    };
    await ctx.db
      .insert(schema.reposts)
      .values({ uri, indexedAt, ...data })
      .onConflictDoUpdate({ target: schema.reposts.uri, set: data });
  }
}
