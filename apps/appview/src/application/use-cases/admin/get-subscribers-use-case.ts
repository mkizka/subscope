import { asDid } from "@atproto/did";
import type * as MeSubscoAdminGetSubscribers from "@repo/client/lex/me/subsco/admin/getSubscribers";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
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
  ) {}
  static inject = [
    "subscriptionService",
    "profileViewService",
    "actorRepository",
  ] as const;

  async execute(
    params: GetSubscribersParams,
  ): Promise<MeSubscoAdminGetSubscribers.$OutputBody> {
    const paginationResult =
      await this.subscriptionService.findSubscribersWithPagination({
        limit: params.limit,
        cursor: params.cursor,
      });

    const dids = paginationResult.items.map((sub) => asDid(sub.actorDid));
    const [profiles, actors] = await Promise.all([
      this.profileViewService.findProfileView(dids),
      Promise.all(dids.map((did) => this.actorRepository.findByDid(did))),
    ]);
    const adminDids = new Set(
      actors.filter((actor) => actor?.isAdmin).map((actor) => actor?.did),
    );

    return {
      cursor: paginationResult.cursor,
      subscribers: profiles.map((profile) => ({
        profile,
        isAdmin: adminDids.has(profile.did),
      })),
    };
  }
}
