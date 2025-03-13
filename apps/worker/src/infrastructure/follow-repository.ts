import type { Follow, TransactionContext } from "@dawn/common/domain";
import { schema } from "@dawn/db";

import type { IFollowRepository } from "../application/interfaces/follow-repository.js";

export class FollowRepository implements IFollowRepository {
  async upsert({ ctx, follow }: { ctx: TransactionContext; follow: Follow }) {
    const data = {
      cid: follow.cid,
      actorDid: follow.actorDid,
      subjectDid: follow.subjectDid,
      createdAt: follow.createdAt,
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
