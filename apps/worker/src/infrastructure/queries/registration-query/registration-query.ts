import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";

export class RegistrationQuery implements IRegistrationQuery {
  async isRegistered(
    ctx: TransactionContext,
    actorDid: string,
  ): Promise<boolean> {
    const result = await ctx.db
      .select({ actorDid: schema.registrations.actorDid })
      .from(schema.registrations)
      .where(eq(schema.registrations.actorDid, actorDid))
      .limit(1);

    return result.length > 0;
  }

  async isFollowedByAnyRegisteredAccount(
    ctx: TransactionContext,
    subjectDid: string,
  ): Promise<boolean> {
    const result = await ctx.db
      .select({ actorDid: schema.follows.actorDid })
      .from(schema.follows)
      .innerJoin(
        schema.registrations,
        eq(schema.follows.actorDid, schema.registrations.actorDid),
      )
      .where(eq(schema.follows.subjectDid, subjectDid))
      .limit(1);

    return result.length > 0;
  }
}
