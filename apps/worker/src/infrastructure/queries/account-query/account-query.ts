import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { eq, isNull } from "drizzle-orm";

import type { IAccountQuery } from "../../../application/interfaces/queries/account-query.js";

export class AccountQuery implements IAccountQuery {
  async exists({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    const [row] = await ctx.db
      .select({ did: schema.accounts.did })
      .from(schema.accounts)
      .where(eq(schema.accounts.did, did))
      .limit(1);
    return row !== undefined;
  }

  async findMemberDidsWithoutBackfillStatus(ctx: TransactionContext) {
    const rows = await ctx.db
      .select({ did: schema.accounts.did })
      .from(schema.accounts)
      .innerJoin(
        schema.registrations,
        eq(schema.registrations.accountDid, schema.accounts.did),
      )
      .where(isNull(schema.accounts.backfillStatus));
    return rows.map((row) => asDid(row.did));
  }
}
