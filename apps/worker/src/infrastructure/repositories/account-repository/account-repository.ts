import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import { type AccountInsert, schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IAccountRepository } from "../../../application/interfaces/repositories/account-repository.js";
import { Account } from "../../../domain/account.js";

export class AccountRepository implements IAccountRepository {
  async save({ ctx, account }: { ctx: TransactionContext; account: Account }) {
    const data = {
      handle: account.handle,
      status: account.status,
      backfillStatus: account.backfillStatus,
    } satisfies AccountInsert;
    await ctx.db
      .insert(schema.accounts)
      .values({
        did: account.did,
        indexedAt: account.indexedAt,
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.accounts.did,
        set: data,
      });
  }

  async find({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    const [row] = await ctx.db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.did, did))
      .limit(1);
    if (!row) {
      return null;
    }
    return Account.reconstruct({
      did: asDid(row.did),
      handle: row.handle || null,
      status: row.status,
      backfillStatus: row.backfillStatus,
      indexedAt: row.indexedAt,
    });
  }

  async delete({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    await ctx.db.delete(schema.accounts).where(eq(schema.accounts.did, did));
  }
}
