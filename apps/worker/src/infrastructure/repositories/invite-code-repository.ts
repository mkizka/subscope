import { InviteCode, type TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IInviteCodeRepository } from "../../application/interfaces/repositories/invite-code-repository.js";

export class InviteCodeRepository implements IInviteCodeRepository {
  async findByCode(
    ctx: TransactionContext,
    code: string,
  ): Promise<InviteCode | null> {
    const [row] = await ctx.db
      .select()
      .from(schema.inviteCodes)
      .where(eq(schema.inviteCodes.code, code))
      .limit(1);

    if (!row) {
      return null;
    }

    return new InviteCode({
      code: row.code,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    });
  }
}
