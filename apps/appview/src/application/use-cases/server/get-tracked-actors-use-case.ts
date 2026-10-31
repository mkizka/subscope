import type { Did } from "@atproto/did";
import type * as MeSubscoServerGetTrackedActors from "@repo/client/lex/me/subsco/server/getTrackedActors";

import type { ISubscriptionRepository } from "../../../application/interfaces/subscription-repository.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetTrackedActorsUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
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

    const ctx = this.viewContextFactory.create();
    const profiles = await Promise.all(
      page.items.map((item) => this.profileViews.view(item.did, ctx)),
    );

    return {
      cursor: page.cursor,
      total,
      trackedActors: page.items.flatMap((item, i) => {
        const profile = profiles[i];
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
