import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { and, eq, isNull, lt, or } from "drizzle-orm";

import type { IRepoRevRepository } from "../../../application/interfaces/repositories/repo-rev-repository.js";

export class RepoRevRepository implements IRepoRevRepository {
  async save({
    ctx,
    did,
    rev,
  }: {
    ctx: TransactionContext;
    did: Did;
    rev: string;
  }) {
    await ctx.db
      .update(schema.accounts)
      .set({ rev })
      .where(
        and(
          eq(schema.accounts.did, did),
          or(isNull(schema.accounts.rev), lt(schema.accounts.rev, rev)),
        ),
      );
  }
}
