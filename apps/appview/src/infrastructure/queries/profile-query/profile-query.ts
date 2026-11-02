import { asDid, type Did } from "@atproto/did";
import { isValidHandle } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, ilike, inArray, lt, or } from "drizzle-orm";

import type { ProfileDto } from "../../../application/dto/profile-dto.js";
import type { IProfileQuery } from "../../../application/interfaces/queries/profile-query.js";

const toDto = ({
  actor,
  profile,
}: {
  actor: typeof schema.actors.$inferSelect;
  profile: typeof schema.profiles.$inferSelect | null;
}): ProfileDto => ({
  actorDid: asDid(actor.did),
  handle: isValidHandle(actor.handle) ? actor.handle : null,
  displayName: profile?.displayName ?? null,
  description: profile?.description ?? null,
  avatarCid: profile?.avatarCid ?? null,
  bannerCid: profile?.bannerCid ?? null,
  createdAt: profile?.createdAt ?? null,
  indexedAt: profile?.indexedAt ?? actor.indexedAt,
  status: actor.status,
});

export class ProfileQuery implements IProfileQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findByDids(dids: Did[]): Promise<ProfileDto[]> {
    const rows = await this.db
      .select({ actor: schema.actors, profile: schema.profiles })
      .from(schema.actors)
      .leftJoin(
        schema.profiles,
        eq(schema.actors.did, schema.profiles.actorDid),
      )
      .where(inArray(schema.actors.did, dids));
    return rows.map(toDto);
  }

  async search(params: {
    query: string;
    limit: number;
    cursor?: Date;
  }): Promise<ProfileDto[]> {
    const pattern = `%${params.query.replace(/[%_]/g, "\\$&")}%`;
    const rows = await this.db
      .select({ actor: schema.actors, profile: schema.profiles })
      .from(schema.profiles)
      .innerJoin(schema.actors, eq(schema.profiles.actorDid, schema.actors.did))
      .where(
        and(
          or(
            ilike(schema.profiles.displayName, pattern),
            ilike(schema.actors.handle, pattern),
          ),
          params.cursor && lt(schema.profiles.indexedAt, params.cursor),
        ),
      )
      .orderBy(desc(schema.profiles.indexedAt))
      .limit(params.limit);
    return rows.map(toDto);
  }
}
