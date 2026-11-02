import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { desc, eq, lt } from "drizzle-orm";

import type { InviteCodeDto } from "../../../application/dto/invite-code-dto.js";
import type { IInviteCodeQuery } from "../../../application/interfaces/queries/invite-code-query.js";

export class InviteCodeQuery implements IInviteCodeQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findAll(params: {
    limit: number;
    cursor?: string;
  }): Promise<InviteCodeDto[]> {
    const rows = await this.db
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
      .where(
        params.cursor
          ? lt(schema.inviteCodes.createdAt, new Date(params.cursor))
          : undefined,
      )
      .orderBy(desc(schema.inviteCodes.createdAt))
      .limit(params.limit);

    return rows.map((row) => ({
      code: row.code,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      usedAt: row.usedAt,
      usedByDid: row.usedByDid ? asDid(row.usedByDid) : null,
    }));
  }
}
