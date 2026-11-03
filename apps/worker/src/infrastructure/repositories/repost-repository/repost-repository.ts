import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { IRepostRepository } from "../../../application/interfaces/repositories/repost-repository.js";
import type { RepostRow } from "../../../application/record-parsers.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class RepostRepository implements IRepostRepository {
  async save({ ctx, repost }: { ctx: TransactionContext; repost: RepostRow }) {
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
