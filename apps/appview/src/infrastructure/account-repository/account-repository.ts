import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import {
  type DatabaseClient,
  type TransactionContext,
} from "@repo/common/domain";
import { type AccountInsert, schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IAccountRepository } from "../../application/interfaces/account-repository.js";
import { Account } from "../../domain/models/account.js";

export class AccountRepository implements IAccountRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save({ ctx, account }: { ctx: TransactionContext; account: Account }) {
    const data = {
      handle: account.handle,
      isAdmin: account.isAdmin,
      isBanned: account.isBanned,
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

  async find(did: Did): Promise<Account | null> {
    const [row] = await this.db
      .select({
        did: schema.accounts.did,
        handle: schema.accounts.handle,
        isAdmin: schema.accounts.isAdmin,
        isBanned: schema.accounts.isBanned,
        backfillStatus: schema.accounts.backfillStatus,
        indexedAt: schema.accounts.indexedAt,
      })
      .from(schema.accounts)
      .where(eq(schema.accounts.did, did))
      .limit(1);

    if (!row) {
      return null;
    }

    return Account.reconstruct({
      did: asDid(row.did),
      handle: row.handle,
      isAdmin: row.isAdmin,
      isBanned: row.isBanned,
      backfillStatus: row.backfillStatus,
      indexedAt: row.indexedAt,
    });
  }
}
