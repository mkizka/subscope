import { asDid } from "@atproto/did";
import { toDatetimeString } from "@atproto/syntax";
import type * as MeSubscoAdminGetSubscribers from "@repo/client/lex/me/subsco/admin/getSubscribers";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { ISubscriptionRepository } from "../../../application/interfaces/subscription-repository.js";
import type { SubscriptionService } from "../../../application/service/admin/subscription-service.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type GetSubscribersParams = {
  limit: number;
  cursor?: string;
};

export class GetSubscribersUseCase {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
    private readonly actorRepository: IActorRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(
    params: GetSubscribersParams,
  ): Promise<MeSubscoAdminGetSubscribers.$OutputBody> {
    const [paginationResult, total] = await Promise.all([
      this.subscriptionService.findSubscribersWithPagination({
        limit: params.limit,
        cursor: params.cursor,
      }),
      this.subscriptionRepository.count(),
    ]);

    const ctx = this.viewContextFactory.create({ includeTakedowns: true });
    const backfillStatuses =
      await this.actorRepository.findBackfillStatusesWithFollows(
        paginationResult.items.map((sub) => asDid(sub.actorDid)),
      );
    const subscribers = await Promise.all(
      paginationResult.items.map(async (sub) => {
        const did = asDid(sub.actorDid);
        const [profile, actor] = await Promise.all([
          this.profileViews.view(did, ctx),
          this.actorRepository.findByDid(did),
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
