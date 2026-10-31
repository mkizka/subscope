import { asDid, type Did } from "@atproto/did";
import { isValidHandle } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq, inArray } from "drizzle-orm";

import type { ProfileDto } from "../../application/dto/profile-dto.js";
import type { IProfileQuery } from "../../application/interfaces/profile-query.js";

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
    return rows.map(({ actor, profile }) => ({
      actorDid: asDid(actor.did),
      handle: isValidHandle(actor.handle) ? actor.handle : null,
      displayName: profile?.displayName ?? null,
      description: profile?.description ?? null,
      avatarCid: profile?.avatarCid ?? null,
      createdAt: profile?.createdAt ?? null,
      indexedAt: profile?.indexedAt ?? actor.indexedAt,
      status: actor.status,
    }));
  }
}
