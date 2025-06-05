import type { AtUri } from "@atproto/syntax";
import type { Record, TransactionContext } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";

import type { IRecordRepository } from "../application/interfaces/record-repository.js";

export class RecordRepository implements IRecordRepository {
  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const data = {
      cid: record.cid,
      actorDid: record.actorDid,
      json: record.json,
    };
    await ctx.db
      .insert(schema.records)
      .values({
        uri: record.uri.toString(),
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.records.uri,
        set: data,
      });
  }

  async delete({ ctx, uri }: { ctx: TransactionContext; uri: AtUri }) {
    await ctx.db
      .delete(schema.records)
      .where(eq(schema.records.uri, uri.toString()));
  }
}
