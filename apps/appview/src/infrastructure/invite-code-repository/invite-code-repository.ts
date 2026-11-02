import { asDid } from "@atproto/did";
import type {
  DatabaseClient,
  InviteCode,
  TransactionContext,
} from "@repo/common/domain";
import { InviteCode as InviteCodeDomain } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, lt } from "drizzle-orm";

import type { InviteCodeDto } from "../../application/dto/invite-code-dto.js";
import type { IInviteCodeRepository } from "../../application/interfaces/invite-code-repository.js";

export class InviteCodeRepository implements IInviteCodeRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save({
    inviteCode,
    ctx,
  }: {
    inviteCode: InviteCode;
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

  async findAll(params: {
    limit: number;
    cursor?: string;
  }): Promise<InviteCodeDto[]> {
    const filters = [];

    if (params.cursor) {
      const cursor = new Date(params.cursor);
      filters.push(lt(schema.inviteCodes.createdAt, cursor));
    }

    const query = this.db
      .select({
        code: schema.inviteCodes.code,
        expiresAt: schema.inviteCodes.expiresAt,
        usedAt: schema.inviteCodes.usedAt,
        createdAt: schema.inviteCodes.createdAt,
        usedByDid: schema.subscriptions.actorDid,
      })
      .from(schema.inviteCodes)
      .leftJoin(
        schema.subscriptions,
        eq(schema.inviteCodes.code, schema.subscriptions.inviteCode),
      )
      .orderBy(desc(schema.inviteCodes.createdAt))
      .limit(params.limit);

    if (filters.length > 0) {
      query.where(and(...filters));
    }

    const rows = await query;

    return rows.map((row) => ({
      code: row.code,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      usedAt: row.usedAt,
      usedByDid: row.usedByDid ? asDid(row.usedByDid) : null,
    }));
  }

  async find({
    code,
    ctx,
  }: {
    code: string;
    ctx: TransactionContext;
  }): Promise<InviteCode | null> {
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
