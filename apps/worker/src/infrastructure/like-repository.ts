import type { Like, TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { ILikeRepository } from "../application/interfaces/repositories/like-repository.js";

export class LikeRepository implements ILikeRepository {
  async upsert({ ctx, like }: { ctx: TransactionContext; like: Like }) {
    const data = {
      cid: like.cid,
      actorDid: like.actorDid,
      subjectUri: like.subjectUri.toString(),
      subjectCid: like.subjectCid,
      createdAt: like.createdAt,
    };
    await ctx.db
      .insert(schema.likes)
      .values({
        uri: like.uri.toString(),
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.likes.uri,
        set: data,
      });
  }
}
