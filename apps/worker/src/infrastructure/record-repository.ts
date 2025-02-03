import type { AtUri } from "@atproto/syntax";
import type { Record, TransactionContext } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";

import type { IRecordRepository } from "../application/interfaces/record-repository.js";

export class RecordRepository implements IRecordRepository {
  async createOrUpdate({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }) {
    await ctx.db
      .insert(schema.record)
      .values({
        uri: record.uri.toString(),
        cid: record.cid,
        actorDid: record.actorDid,
        json: record.json,
      })
      .onDuplicateKeyUpdate({
        set: {
          cid: record.cid,
          actorDid: record.actorDid,
          json: record.json,
        },
      });
  }

  async delete({ ctx, uri }: { ctx: TransactionContext; uri: AtUri }) {
    await ctx.db
      .delete(schema.record)
      .where(eq(schema.record.uri, uri.toString()));
  }
}
