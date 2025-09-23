import { type DatabaseClient, Subscription } from "@repo/common/domain";
import { schema } from "@repo/db";
import { lt } from "drizzle-orm";

import type { ISubscriptionRepository } from "../application/interfaces/subscription-repository.js";

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findMany(params: {
    limit: number;
    cursor?: string;
  }): Promise<Subscription[]> {
    const filters = [];

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      filters.push(lt(schema.subscriptions.createdAt, cursorDate));
    }

    const results = await this.db.query.subscriptions.findMany({
      where: filters.length > 0 ? filters[0] : undefined,
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
      limit: params.limit,
    });

    return results.map(
      (sub) =>
        new Subscription({
          actorDid: sub.actorDid,
          inviteCode: sub.inviteCode,
          createdAt: sub.createdAt,
        }),
    );
  }
}
