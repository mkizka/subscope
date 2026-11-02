import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";

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

  async findTrackedDidsWithoutBackfillStatus(ctx: TransactionContext) {
    const trackedDids = union(
      ctx.db
        .select({ did: schema.registrations.accountDid })
        .from(schema.registrations),
      ctx.db
        .select({ did: schema.follows.subjectDid })
        .from(schema.follows)
        .innerJoin(
          schema.registrations,
          eq(schema.follows.accountDid, schema.registrations.accountDid),
        ),
    );
    const rows = await ctx.db
      .select({ did: schema.accounts.did })
      .from(schema.accounts)
      .where(
        and(
          isNull(schema.accounts.backfillStatus),
          inArray(schema.accounts.did, trackedDids),
        ),
      );
    return rows.map((row) => asDid(row.did));
  }
}
