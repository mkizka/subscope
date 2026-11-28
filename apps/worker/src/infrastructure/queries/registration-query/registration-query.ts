import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { eq, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

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

  async findMemberDids(ctx: TransactionContext): Promise<Did[]> {
    const rows = await ctx.db
      .select({ did: schema.registrations.accountDid })
      .from(schema.registrations);
    return rows.map((row) => asDid(row.did));
  }

  async findTrackedDids(ctx: TransactionContext): Promise<Did[]> {
    const subjectRegistrations = alias(
      schema.registrations,
      "subject_registrations",
    );
    const rows = await ctx.db
      .selectDistinct({ did: schema.follows.subjectDid })
      .from(schema.follows)
      .innerJoin(
        schema.registrations,
        eq(schema.follows.accountDid, schema.registrations.accountDid),
      )
      .leftJoin(
        subjectRegistrations,
        eq(schema.follows.subjectDid, subjectRegistrations.accountDid),
      )
      .where(isNull(subjectRegistrations.accountDid));
    return rows.map((row) => asDid(row.did));
  }
}
