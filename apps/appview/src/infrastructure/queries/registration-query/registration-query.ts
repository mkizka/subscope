import { asDid, type Did } from "@atproto/did";
import { type DatabaseClient, Registration } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  lt,
  or,
} from "drizzle-orm";

import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";

export class RegistrationQuery implements IRegistrationQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findMany(params: {
    limit: number;
    cursor?: string;
  }): Promise<Registration[]> {
    const filters = [];

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      filters.push(lt(schema.registrations.createdAt, cursorDate));
    }

    const rows = await this.db.query.registrations.findMany({
      where: filters.length > 0 ? filters[0] : undefined,
      orderBy: (registrations, { desc }) => [desc(registrations.createdAt)],
      limit: params.limit,
    });

    return rows.map(
      (row) =>
        new Registration({
          actorDid: row.actorDid,
          inviteCode: row.inviteCode,
          seenAt: row.seenAt,
          createdAt: row.createdAt,
        }),
    );
  }

  async count(): Promise<number> {
    const [row] = await this.db
      .select({ count: count() })
      .from(schema.registrations);
    return row?.count ?? 0;
  }

  async findTrackedAccounts(params: {
    limit: number;
    cursor?: string;
  }): Promise<{ did: Did; registeredFollowersCount: number }[]> {
    const { actors, follows, registrations } = schema;
    const registeredFollowersCount = countDistinct(registrations.actorDid);
    const cursor = params.cursor?.split("::");

    const rows = await this.db
      .select({ did: actors.did, registeredFollowersCount })
      .from(actors)
      .leftJoin(follows, eq(follows.subjectDid, actors.did))
      .leftJoin(registrations, eq(registrations.actorDid, follows.actorDid))
      .where(this.isTrackedAccount())
      .groupBy(actors.did)
      .having(
        cursor
          ? or(
              lt(registeredFollowersCount, Number(cursor[0])),
              and(
                eq(registeredFollowersCount, Number(cursor[0])),
                gt(actors.did, cursor[1] ?? ""),
              ),
            )
          : undefined,
      )
      .orderBy(desc(registeredFollowersCount), asc(actors.did))
      .limit(params.limit);

    return rows.map((row) => ({ ...row, did: asDid(row.did) }));
  }

  async countTrackedAccounts(): Promise<number> {
    const { actors, follows, registrations } = schema;
    const [row] = await this.db
      .select({ total: countDistinct(actors.did) })
      .from(actors)
      .leftJoin(follows, eq(follows.subjectDid, actors.did))
      .leftJoin(registrations, eq(registrations.actorDid, follows.actorDid))
      .where(this.isTrackedAccount());
    return row?.total ?? 0;
  }

  private isTrackedAccount() {
    const { actors, registrations } = schema;
    return or(
      isNotNull(registrations.actorDid),
      inArray(
        actors.did,
        this.db.select({ did: registrations.actorDid }).from(registrations),
      ),
    );
  }
}
