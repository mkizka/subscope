import type { DatabaseClient } from "@repo/common/domain";
import { ProfileDetailed } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, ilike, lt, or } from "drizzle-orm";

import type { IProfileRepository } from "../../application/interfaces/profile-repository.js";

export class ProfileRepository implements IProfileRepository {
  constructor(private readonly db: DatabaseClient) {}

  private escapeWildcards(query: string): string {
    return query.replace(/[%_]/g, "\\$&");
  }

  async searchActors(params: {
    query: string;
    limit: number;
    cursor?: string;
  }): Promise<ProfileDetailed[]> {
    const escapedQuery = this.escapeWildcards(params.query);
    const filters = [
      or(
        ilike(schema.profiles.displayName, `%${escapedQuery}%`),
        ilike(schema.actors.handle, `%${escapedQuery}%`),
      ),
    ];

    if (params.cursor) {
      const cursor = new Date(params.cursor);
      filters.push(lt(schema.profiles.indexedAt, cursor));
    }

    const results = await this.db
      .select({
        profile: schema.profiles,
        actor: schema.actors,
      })
      .from(schema.profiles)
      .innerJoin(schema.actors, eq(schema.profiles.actorDid, schema.actors.did))
      .where(and(...filters))
      .orderBy(desc(schema.profiles.indexedAt))
      .limit(params.limit);

    return results.map(
      (result) =>
        new ProfileDetailed({
          actorDid: result.profile.actorDid,
          handle: result.actor.handle,
          avatarCid: result.profile.avatarCid,
          description: result.profile.description,
          displayName: result.profile.displayName,
          createdAt: result.profile.createdAt,
          indexedAt: result.profile.indexedAt,
          status: result.actor.status,
        }),
    );
  }
}
