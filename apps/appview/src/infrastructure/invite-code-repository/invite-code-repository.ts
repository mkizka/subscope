import type { DatabaseClient, TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IInviteCodeRepository } from "../../application/interfaces/invite-code-repository.js";
import { InviteCode as InviteCodeDomain } from "../../domain/models/invite-code.js";

export class InviteCodeRepository implements IInviteCodeRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save({
    inviteCode,
    ctx,
  }: {
    inviteCode: InviteCodeDomain;
    ctx: TransactionContext;
  }): Promise<void> {
    await ctx.db
      .insert(schema.inviteCodes)
      .values({
        code: inviteCode.code,
        expiresAt: inviteCode.expiresAt,
        usedAt: inviteCode.usedAt,
        createdAt: inviteCode.createdAt,
      })
      .onConflictDoUpdate({
        target: schema.inviteCodes.code,
        set: {
          expiresAt: inviteCode.expiresAt,
          usedAt: inviteCode.usedAt,
        },
      });
  }

  async delete({
    code,
    ctx,
  }: {
    code: string;
    ctx: TransactionContext;
  }): Promise<void> {
    await ctx.db
      .delete(schema.inviteCodes)
      .where(eq(schema.inviteCodes.code, code));
  }

  async find({
    code,
    ctx,
  }: {
    code: string;
    ctx: TransactionContext;
  }): Promise<InviteCodeDomain | null> {
    const [row] = await ctx.db
      .select()
      .from(schema.inviteCodes)
      .where(eq(schema.inviteCodes.code, code))
      .for("update");

    if (!row) {
      return null;
    }

    return new InviteCodeDomain({
      code: row.code,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    });
  }
}
