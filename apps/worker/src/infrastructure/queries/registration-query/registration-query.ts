import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";

export class RegistrationQuery implements IRegistrationQuery {
  async isRegistered(
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

  async isFollowedByAnyRegisteredAccount(
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
