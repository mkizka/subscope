import { asDid } from "@atproto/did";
import type * as MeSubscoAdminGetSubscribers from "@repo/client/lex/me/subsco/admin/getSubscribers";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { ISubscriptionRepository } from "../../../application/interfaces/subscription-repository.js";
import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import type { SubscriptionService } from "../../../application/service/admin/subscription-service.js";

type GetSubscribersParams = {
  limit: number;
  cursor?: string;
};

export class GetSubscribersUseCase {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly profileViewService: ProfileViewService,
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

    const dids = paginationResult.items.map((sub) => asDid(sub.actorDid));
    const [profiles, actors] = await Promise.all([
      this.profileViewService.findProfileView(dids, null, {
        includeTakedowns: true,
      }),
      Promise.all(dids.map((did) => this.actorRepository.findByDid(did))),
    ]);
    const profileMap = new Map(
      profiles.map((profile) => [profile.did, profile]),
    );
    const adminDids = new Set(
      actors.filter((actor) => actor?.isAdmin).map((actor) => actor?.did),
    );

    return {
      cursor: paginationResult.cursor,
      total,
      subscribers: paginationResult.items.flatMap((sub) => {
        const profile = profileMap.get(sub.actorDid);
        if (!profile) return [];
        return [
          {
            profile,
            isAdmin: adminDids.has(profile.did),
            subscribedAt: sub.createdAt.toISOString(),
          },
        ];
      }),
    };
  }
}
