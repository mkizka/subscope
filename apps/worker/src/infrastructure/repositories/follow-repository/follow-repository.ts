import type { Follow, TransactionContext } from "@repo/common/domain";
import { type FollowInsert, schema } from "@repo/db";
import { and, eq } from "drizzle-orm";

import type { IFollowRepository } from "../../../application/interfaces/repositories/follow-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class FollowRepository implements IFollowRepository {
  async upsert({ ctx, follow }: { ctx: TransactionContext; follow: Follow }) {
    const data = {
      cid: follow.cid,
      actorDid: follow.actorDid,
      subjectDid: follow.subjectDid,
      createdAt: sanitizeDate(follow.createdAt),
    } satisfies FollowInsert;
    await ctx.db
      .insert(schema.follows)
      .values({
        uri: follow.uri.toString(),
        indexedAt: follow.indexedAt,
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.follows.uri,
        set: data,
      });
  }

  async isFollowedByAnySubscriber({
    ctx,
    subjectDid,
  }: {
    ctx: TransactionContext;
    subjectDid: string;
  }): Promise<boolean> {
    const result = await ctx.db
      .select({ actorDid: schema.follows.actorDid })
      .from(schema.follows)
      .innerJoin(
        schema.subscriptions,
        eq(schema.follows.actorDid, schema.subscriptions.actorDid),
      )
      .where(and(eq(schema.follows.subjectDid, subjectDid)))
      .limit(1);

    return result.length > 0;
  }
}
