import type { Did } from "@atproto/did";
import type * as MeSubscoServerGetTrackedActors from "@repo/client/lex/me/subsco/server/getTrackedActors";

import type { ISubscriptionRepository } from "../../../application/interfaces/subscription-repository.js";
import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";

export class GetTrackedActorsUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly profileViewService: ProfileViewService,
  ) {}

  async execute(params: {
    limit: number;
    cursor?: string;
  }): Promise<MeSubscoServerGetTrackedActors.$OutputBody> {
    const paginator = createCursorPaginator<{
      did: Did;
      subscriberFollowersCount: number;
    }>({
      limit: params.limit,
      getCursor: (item) => `${item.subscriberFollowersCount}::${item.did}`,
    });
    const [items, total] = await Promise.all([
      this.subscriptionRepository.findTrackedActors({
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
      this.subscriptionRepository.countTrackedActors(),
    ]);
    const page = paginator.extractPage(items);

    const profiles = await this.profileViewService.findProfileView(
      page.items.map((item) => item.did),
    );
    const profileMap = new Map(profiles.map((p) => [p.did, p]));

    return {
      cursor: page.cursor,
      total,
      trackedActors: page.items.flatMap((item) => {
        const profile = profileMap.get(item.did);
        return profile
          ? [
              {
                profile,
                subscriberFollowersCount: item.subscriberFollowersCount,
              },
            ]
          : [];
      }),
    };
  }
}
