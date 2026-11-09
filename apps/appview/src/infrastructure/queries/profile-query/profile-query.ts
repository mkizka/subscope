import { asDid, type Did } from "@atproto/did";
import { isValidHandle } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/interface";
import { schema } from "@repo/db";
import { and, desc, eq, ilike, inArray, lt, or, sql } from "drizzle-orm";

import type { ProfileDto } from "../../../application/dto/profile-dto.js";
import type { IProfileQuery } from "../../../application/interfaces/queries/profile-query.js";

const toDto = ({
  account,
  profile,
}: {
  account: typeof schema.accounts.$inferSelect;
  profile: typeof schema.profiles.$inferSelect | null;
}): ProfileDto => ({
  accountDid: asDid(account.did),
  handle: isValidHandle(account.handle) ? account.handle : null,
  displayName: profile?.displayName ?? null,
  description: profile?.description ?? null,
  avatarCid: profile?.avatarCid ?? null,
  bannerCid: profile?.bannerCid ?? null,
  createdAt: profile?.createdAt ?? null,
  indexedAt: profile?.indexedAt ?? account.indexedAt,
  status: account.status,
});

export class ProfileQuery implements IProfileQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findByDids(dids: Did[]): Promise<ProfileDto[]> {
    const rows = await this.db
      .select({ account: schema.accounts, profile: schema.profiles })
      .from(schema.accounts)
      .leftJoin(
        schema.profiles,
        eq(schema.accounts.did, schema.profiles.accountDid),
      )
      .where(inArray(schema.accounts.did, dids));
    return rows.map(toDto);
  }

  async search(params: {
    query: string;
    limit: number;
    cursor?: Date;
  }): Promise<ProfileDto[]> {
    const indexedAt = sql<Date>`coalesce(${schema.profiles.indexedAt}, ${schema.accounts.indexedAt})`;
    const pattern = `%${params.query.replace(/[%_]/g, "\\$&")}%`;
    const rows = await this.db
      .select({ account: schema.accounts, profile: schema.profiles })
      .from(schema.accounts)
      .leftJoin(
        schema.profiles,
        eq(schema.accounts.did, schema.profiles.accountDid),
      )
      .where(
        and(
          or(
            ilike(schema.profiles.displayName, pattern),
            ilike(schema.accounts.handle, pattern),
          ),
          params.cursor && lt(indexedAt, params.cursor),
        ),
      )
      .orderBy(desc(indexedAt))
      .limit(params.limit);
    return rows.map(toDto);
  }
}
