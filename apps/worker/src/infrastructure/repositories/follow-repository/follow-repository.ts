import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { IFollowRepository } from "../../../application/interfaces/repositories/follow-repository.js";
import type { Follow } from "../../../application/models/follow.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class FollowRepository implements IFollowRepository {
  async save({ ctx, follow }: { ctx: TransactionContext; follow: Follow }) {
    const { uri, indexedAt, ...rest } = follow;
    const data = {
      ...rest,
      createdAt: sanitizeDate(rest.createdAt),
    };
    await ctx.db
      .insert(schema.follows)
      .values({ uri, indexedAt, ...data })
      .onConflictDoUpdate({ target: schema.follows.uri, set: data });
  }
}
