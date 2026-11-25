import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IRecordQuery } from "../../../application/interfaces/queries/record-query.js";

export class RecordQuery implements IRecordQuery {
  async exists(ctx: TransactionContext, uri: AtUri): Promise<boolean> {
    const result = await ctx.db
      .select({ uri: schema.records.uri })
      .from(schema.records)
      .where(eq(schema.records.uri, uri.toString()))
      .limit(1);

    return result.length > 0;
  }
}
