import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { eq, inArray } from "drizzle-orm";

import type { IRegistrationQuery } from "../../../domain/interfaces/registration-query.js";

export class RegistrationQuery implements IRegistrationQuery {
  async isMember(
    ctx: TransactionContext,
    accountDid: string,
  ): Promise<boolean> {
    const result = await ctx.db
      .select({ accountDid: schema.registrations.accountDid })
      .from(schema.registrations)
      .where(eq(schema.registrations.accountDid, accountDid))
      .limit(1);

    return result.length > 0;
  }

  async includesMember(ctx: TransactionContext, dids: string[]) {
    if (dids.length === 0) {
      return false;
    }
    const result = await ctx.db
      .select({ accountDid: schema.registrations.accountDid })
      .from(schema.registrations)
      .where(inArray(schema.registrations.accountDid, dids))
      .limit(1);

    return result.length > 0;
  }

  async isFollowedByAnyServerMember(
    ctx: TransactionContext,
    subjectDid: string,
  ): Promise<boolean> {
    const result = await ctx.db
      .select({ accountDid: schema.follows.accountDid })
      .from(schema.follows)
      .innerJoin(
        schema.registrations,
        eq(schema.follows.accountDid, schema.registrations.accountDid),
      )
      .where(eq(schema.follows.subjectDid, subjectDid))
      .limit(1);

    return result.length > 0;
  }
}
