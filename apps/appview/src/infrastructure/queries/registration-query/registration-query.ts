import { asDid, type Did } from "@atproto/did";
import {
  type BackfillStatus,
  type DatabaseClient,
  Registration,
} from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNotNull,
  lt,
  or,
} from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";

import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";

export class RegistrationQuery implements IRegistrationQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findMany(params: {
    limit: number;
    cursor?: string;
    q?: string;
  }): Promise<Registration[]> {
    const rows = await this.db.query.registrations.findMany({
      where: and(
        params.cursor
          ? lt(schema.registrations.createdAt, new Date(params.cursor))
          : undefined,
        params.q
          ? inArray(schema.registrations.accountDid, this.matching(params.q))
          : undefined,
      ),
      orderBy: (registrations, { desc }) => [desc(registrations.createdAt)],
      limit: params.limit,
    });

    return rows.map(
      (row) =>
        new Registration({
          accountDid: row.accountDid,
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
    q?: string;
  }): Promise<{ did: Did; registeredFollowersCount: number }[]> {
    const { accounts, follows, registrations } = schema;
    const registeredFollowersCount = countDistinct(registrations.accountDid);
    const cursor = params.cursor?.split("::");

    const rows = await this.db
      .select({ did: accounts.did, registeredFollowersCount })
      .from(accounts)
      .leftJoin(follows, eq(follows.subjectDid, accounts.did))
      .leftJoin(registrations, eq(registrations.accountDid, follows.accountDid))
      .where(
        and(
          this.isTrackedAccount(),
          params.q ? inArray(accounts.did, this.matching(params.q)) : undefined,
        ),
      )
      .groupBy(accounts.did)
      .having(
        cursor
          ? or(
              lt(registeredFollowersCount, Number(cursor[0])),
              and(
                eq(registeredFollowersCount, Number(cursor[0])),
                gt(accounts.did, cursor[1] ?? ""),
              ),
            )
          : undefined,
      )
      .orderBy(desc(registeredFollowersCount), asc(accounts.did))
      .limit(params.limit);

    return rows.map((row) => ({ ...row, did: asDid(row.did) }));
  }

  async countTrackedAccounts(): Promise<number> {
    const { accounts, follows, registrations } = schema;
    const [row] = await this.db
      .select({ total: countDistinct(accounts.did) })
      .from(accounts)
      .leftJoin(follows, eq(follows.subjectDid, accounts.did))
      .leftJoin(registrations, eq(registrations.accountDid, follows.accountDid))
      .where(this.isTrackedAccount());
    return row?.total ?? 0;
  }

  async findTrackedBackfillStatuses(
    dids: Did[],
  ): Promise<{ did: Did; status: BackfillStatus }[]> {
    if (dids.length === 0) {
      return [];
    }
    const { accounts, follows, registrations } = schema;
    const trackedDids = union(
      this.db.select({ did: registrations.accountDid }).from(registrations),
      this.db
        .select({ did: follows.subjectDid })
        .from(follows)
        .innerJoin(
          registrations,
          eq(follows.accountDid, registrations.accountDid),
        ),
    );
    const rows = await this.db
      .select({ did: accounts.did, status: accounts.backfillStatus })
      .from(accounts)
      .where(
        and(inArray(accounts.did, dids), inArray(accounts.did, trackedDids)),
      );
    return rows.map((row) => ({
      did: asDid(row.did),
      status: row.status ?? "inProgress",
    }));
  }

  private matching(q: string) {
    const { accounts, profiles } = schema;
    const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    return this.db
      .select({ did: accounts.did })
      .from(accounts)
      .leftJoin(profiles, eq(profiles.accountDid, accounts.did))
      .where(
        or(
          ilike(profiles.displayName, pattern),
          ilike(accounts.handle, pattern),
        ),
      );
  }

  private isTrackedAccount() {
    const { accounts, registrations } = schema;
    return or(
      isNotNull(registrations.accountDid),
      inArray(
        accounts.did,
        this.db.select({ did: registrations.accountDid }).from(registrations),
      ),
    );
  }
}
