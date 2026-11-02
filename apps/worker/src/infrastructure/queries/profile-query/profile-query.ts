import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IProfileQuery } from "../../../application/interfaces/queries/profile-query.js";

export class ProfileQuery implements IProfileQuery {
  async exists({
    ctx,
    actorDid,
  }: {
    ctx: TransactionContext;
    actorDid: Did;
  }): Promise<boolean> {
    const result = await ctx.db
      .select({ uri: schema.profiles.uri })
      .from(schema.profiles)
      .where(eq(schema.profiles.actorDid, actorDid))
      .limit(1);
    return result.length > 0;
  }
}
