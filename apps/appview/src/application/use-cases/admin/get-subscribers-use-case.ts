import { asDid } from "@atproto/did";
import { toDatetimeString } from "@atproto/syntax";
import type * as MeSubscoAdminGetSubscribers from "@repo/client/lex/me/subsco/admin/getSubscribers";
import type { Subscription } from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { ISubscriptionQuery } from "../../../application/interfaces/queries/subscription-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IBackfillStatusQuery } from "../../interfaces/queries/backfill-status-query.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type GetSubscribersParams = {
  limit: number;
  cursor?: string;
};

export class GetSubscribersUseCase {
  constructor(
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
    private readonly actorRepository: IActorRepository,
    private readonly subscriptionQuery: ISubscriptionQuery,
    private readonly backfillStatusQuery: IBackfillStatusQuery,
  ) {}

  async execute(
    params: GetSubscribersParams,
  ): Promise<MeSubscoAdminGetSubscribers.$OutputBody> {
    const paginator = createCursorPaginator<Subscription>({
      limit: params.limit,
      getCursor: (sub) => sub.createdAt.toISOString(),
    });
    const [subscriptions, total] = await Promise.all([
      this.subscriptionQuery.findMany({
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
      this.subscriptionQuery.count(),
    ]);
    const paginationResult = paginator.extractPage(subscriptions);

    const ctx = this.viewContextFactory.create({ includeTakedowns: true });
    const backfillStatuses = await this.backfillStatusQuery.findWithFollows(
      paginationResult.items.map((sub) => asDid(sub.actorDid)),
    );
    const subscribers = await Promise.all(
      paginationResult.items.map(async (sub) => {
        const did = asDid(sub.actorDid);
        const [profile, actor] = await Promise.all([
          this.profileViews.view(did, ctx),
          this.actorRepository.find(did),
        ]);
        return (
          profile && {
            profile,
            isAdmin: actor?.isAdmin ?? false,
            subscribedAt: toDatetimeString(sub.createdAt),
            backfillStatus: backfillStatuses.get(did) ?? "inProgress",
          }
        );
      }),
    );

    return {
      cursor: paginationResult.cursor,
      total,
      subscribers: subscribers.filter((sub) => sub !== undefined),
    };
  }
}
