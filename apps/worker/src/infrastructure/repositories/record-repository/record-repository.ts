import { asDid } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import { type RecordInsert, schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IRecordRepository } from "../../../application/interfaces/repositories/record-repository.js";
import type { Record } from "../../../application/models/record.js";

export class RecordRepository implements IRecordRepository {
  async find({
    ctx,
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<Record | null> {
    const [row] = await ctx.db
      .select()
      .from(schema.records)
      .where(eq(schema.records.uri, uri.toString()))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      uri,
      cid: row.cid,
      json: row.json,
      indexedAt: row.indexedAt,
    };
  }

  async save({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const data = {
      cid: record.cid,
      accountDid: asDid(record.uri.host),
      json: record.json,
    } satisfies RecordInsert;
    await ctx.db
      .insert(schema.records)
      .values({
        uri: record.uri.toString(),
        indexedAt: record.indexedAt,
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
