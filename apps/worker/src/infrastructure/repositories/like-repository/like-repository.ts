import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { Like } from "../../../application/dto/like.js";
import type { ILikeRepository } from "../../../application/interfaces/repositories/like-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class LikeRepository implements ILikeRepository {
  async save({ ctx, like }: { ctx: TransactionContext; like: Like }) {
    const { uri, indexedAt, ...rest } = like;
    const data = {
      ...rest,
      createdAt: sanitizeDate(rest.createdAt),
    };
    await ctx.db
      .insert(schema.likes)
      .values({ uri, indexedAt, ...data })
      .onConflictDoUpdate({ target: schema.likes.uri, set: data });
  }
}
