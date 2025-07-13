import type { Follow, TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { IFollowRepository } from "../../application/interfaces/repositories/follow-repository.js";

export class FollowRepository implements IFollowRepository {
  async upsert({ ctx, follow }: { ctx: TransactionContext; follow: Follow }) {
    const data = {
      cid: follow.cid,
      actorDid: follow.actorDid,
      subjectDid: follow.subjectDid,
      createdAt: follow.createdAt,
      indexedAt: follow.indexedAt,
    };
    await ctx.db
      .insert(schema.follows)
      .values({
        uri: follow.uri.toString(),
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.follows.uri,
        set: data,
      });
  }
}
