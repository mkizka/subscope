import type {
  DatabaseClient,
  InviteCode,
  TransactionContext,
} from "@repo/common/domain";
import { InviteCode as InviteCodeDomain } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, lt } from "drizzle-orm";

import type { IInviteCodeRepository } from "../application/interfaces/invite-code-repository.js";

export class InviteCodeRepository implements IInviteCodeRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async upsert({
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

  async findAll(params: {
    limit: number;
    cursor?: string;
  }): Promise<InviteCode[]> {
    const filters = [];

    if (params.cursor) {
      const cursor = new Date(params.cursor);
      filters.push(lt(schema.inviteCodes.createdAt, cursor));
    }

    const query = this.db
      .select()
      .from(schema.inviteCodes)
      .orderBy(desc(schema.inviteCodes.createdAt))
      .limit(params.limit);

    if (filters.length > 0) {
      query.where(and(...filters));
    }

    const rows = await query;

    return rows.map((row) => {
      const code = row.code;
      const expiresAt = row.expiresAt;
      const usedAt = row.usedAt;
      const createdAt = row.createdAt;
      return new InviteCodeDomain({ code, expiresAt, usedAt, createdAt });
    });
  }

  async findFirst(code: string): Promise<InviteCode | null> {
    const [row] = await this.db
      .select()
      .from(schema.inviteCodes)
      .where(eq(schema.inviteCodes.code, code))
      .limit(1);

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
