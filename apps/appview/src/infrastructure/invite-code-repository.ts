import type { DatabaseClient, InviteCode } from "@repo/common/domain";
import { InviteCode as InviteCodeDomain } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, lt } from "drizzle-orm";

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

    const results = await query;

    return results.map((result) => {
      const code = result.code;
      const expiresAt = result.expiresAt;
      const createdAt = result.createdAt;
      return new InviteCodeDomain({ code, expiresAt, createdAt });
    });
  }
}
