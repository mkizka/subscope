import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { lt } from "drizzle-orm";

import type { IRecordRevRepository } from "../../../application/interfaces/repositories/record-rev-repository.js";

export class RecordRevRepository implements IRecordRevRepository {
  async saveIfNewer({
    ctx,
    uri,
    rev,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
    rev: string;
  }) {
    const rows = await ctx.db
      .insert(schema.recordRevs)
      .values({ uri: uri.toString(), rev })
      .onConflictDoUpdate({
        target: schema.recordRevs.uri,
        set: { rev },
        setWhere: lt(schema.recordRevs.rev, rev),
      })
      .returning({ uri: schema.recordRevs.uri });
    return rows.length > 0;
  }
}
