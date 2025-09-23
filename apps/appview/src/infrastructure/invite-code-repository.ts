import type { DatabaseClient, InviteCode } from "@repo/common/domain";
import { InviteCode as InviteCodeDomain } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, lt } from "drizzle-orm";

import type { IInviteCodeRepository } from "../application/interfaces/invite-code-repository.js";

export class InviteCodeRepository implements IInviteCodeRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async save(inviteCode: InviteCode): Promise<void> {
    await this.db.insert(schema.inviteCodes).values({
      code: inviteCode.code,
      expiresAt: inviteCode.expiresAt,
      createdAt: inviteCode.createdAt,
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
      const createdAt = row.createdAt;
      return new InviteCodeDomain({ code, expiresAt, createdAt });
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
      createdAt: row.createdAt,
    });
  }
}
