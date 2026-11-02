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
  }): Promise<{ did: Did; registeredFollowersCount: number }[]> {
    const { accounts, follows, registrations } = schema;
    const registeredFollowersCount = countDistinct(registrations.accountDid);
    const cursor = params.cursor?.split("::");

    const rows = await this.db
      .select({ did: accounts.did, registeredFollowersCount })
      .from(accounts)
      .leftJoin(follows, eq(follows.subjectDid, accounts.did))
      .leftJoin(registrations, eq(registrations.accountDid, follows.accountDid))
      .where(this.isTrackedAccount())
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
