import { asDid } from "@atproto/did";
import type { MeSubscoAdminGetSubscribers } from "@repo/client/server";

import type { ProfileViewService } from "@/server/features/xrpc/application/service/actor/profile-view-service.js";
import type { SubscriptionService } from "@/server/features/xrpc/application/service/admin/subscription-service.js";

type GetSubscribersParams = {
  limit: number;
  cursor?: string;
};

export class GetSubscribersUseCase {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["subscriptionService", "profileViewService"] as const;

  async execute(
    params: GetSubscribersParams,
  ): Promise<MeSubscoAdminGetSubscribers.OutputSchema> {
    const paginationResult =
      await this.subscriptionService.findSubscribersWithPagination({
        limit: params.limit,
        cursor: params.cursor,
      });

    const dids = paginationResult.items.map((sub) => asDid(sub.actorDid));
    const subscribers = await this.profileViewService.findProfileView(dids);

    return {
      cursor: paginationResult.cursor,
      subscribers,
    };
  }
}
