import type { Record, TransactionContext } from "@dawn/common/domain";
import { schema } from "@dawn/db";

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
}
