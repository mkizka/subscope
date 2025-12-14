import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { IIndexTargetRepository } from "../../../application/interfaces/repositories/index-target-repository.js";

export class IndexTargetRepository implements IIndexTargetRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findAllSubscriberDids(): Promise<Did[]> {
    const results = await this.db
      .select({ actorDid: schema.subscriptions.actorDid })
      .from(schema.subscriptions);

    return results.map((r) => asDid(r.actorDid));
  }

  async findFolloweeDids(subscriberDid: Did): Promise<Did[]> {
    const results = await this.db
      .select({ subjectDid: schema.follows.subjectDid })
      .from(schema.follows)
      .where(eq(schema.follows.actorDid, subscriberDid));

    return results.map((r) => asDid(r.subjectDid));
  }

  async findFollowerDid(followUri: string): Promise<Did | null> {
    const result = await this.db
      .select({ actorDid: schema.follows.actorDid })
      .from(schema.follows)
      .where(eq(schema.follows.uri, followUri))
      .limit(1);

    return result[0]?.actorDid ? asDid(result[0].actorDid) : null;
  }

  async findFolloweeDid(followUri: string): Promise<Did | null> {
    const result = await this.db
      .select({ subjectDid: schema.follows.subjectDid })
      .from(schema.follows)
      .where(eq(schema.follows.uri, followUri))
      .limit(1);

    return result[0]?.subjectDid ? asDid(result[0].subjectDid) : null;
  }
}
