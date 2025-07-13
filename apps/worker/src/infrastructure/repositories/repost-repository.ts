import type { Repost, TransactionContext } from "@repo/common/domain";
import { type RepostInsert, schema } from "@repo/db";

import type { IRepostRepository } from "../../application/interfaces/repositories/repost-repository.js";

export class RepostRepository implements IRepostRepository {
  async upsert({ ctx, repost }: { ctx: TransactionContext; repost: Repost }) {
    const data = {
      cid: repost.cid,
      actorDid: repost.actorDid.toString(),
      subjectUri: repost.subjectUri.toString(),
      subjectCid: repost.subjectCid,
      createdAt: repost.createdAt,
    } satisfies RepostInsert;
    await ctx.db
      .insert(schema.reposts)
      .values({
        uri: repost.uri.toString(),
        indexedAt: repost.indexedAt,
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.reposts.uri,
        set: data,
      });
  }
}
