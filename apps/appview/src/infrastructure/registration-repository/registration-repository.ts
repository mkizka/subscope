import type { Did } from "@atproto/did";
import {
  type DatabaseClient,
  Registration,
  type TransactionContext,
} from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IRegistrationRepository } from "../../application/interfaces/registration-repository.js";

export class RegistrationRepository implements IRegistrationRepository {
  constructor(private readonly db: DatabaseClient) {}

  async find(accountDid: Did): Promise<Registration | null> {
    const [row] = await this.db
      .select()
      .from(schema.registrations)
      .where(eq(schema.registrations.accountDid, accountDid))
      .limit(1);

    if (!row) {
      return null;
    }

    return new Registration({
      accountDid: row.accountDid,
      inviteCode: row.inviteCode,
      seenAt: row.seenAt,
      createdAt: row.createdAt,
    });
  }

  async save({
    registration,
    ctx,
  }: {
    registration: Registration;
    ctx: TransactionContext;
  }): Promise<void> {
    await ctx.db
      .insert(schema.registrations)
      .values({
        accountDid: registration.accountDid,
        inviteCode: registration.inviteCode,
        seenAt: registration.seenAt,
        createdAt: registration.createdAt,
      })
      .onConflictDoUpdate({
        target: schema.registrations.accountDid,
        set: {
          inviteCode: registration.inviteCode,
          seenAt: registration.seenAt,
          createdAt: registration.createdAt,
        },
      });
  }

  async delete(accountDid: Did): Promise<void> {
    await this.db
      .delete(schema.registrations)
      .where(eq(schema.registrations.accountDid, accountDid));
  }
}
