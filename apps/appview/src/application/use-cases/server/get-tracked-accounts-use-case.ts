import type { Did } from "@atproto/did";
import type * as MeSubscoServerGetTrackedAccounts from "@repo/client/lex/me/subsco/server/getTrackedAccounts";

import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetTrackedAccountsUseCase {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    limit: number;
    cursor?: string;
    q?: string;
  }): Promise<MeSubscoServerGetTrackedAccounts.$OutputBody> {
    const paginator = createCursorPaginator<{
      did: Did;
      registeredFollowersCount: number;
    }>({
      limit: params.limit,
      getCursor: (item) => `${item.registeredFollowersCount}::${item.did}`,
    });
    const [items, total] = await Promise.all([
      this.registrationQuery.findTrackedAccounts({
        limit: paginator.queryLimit,
        cursor: params.cursor,
        q: params.q,
      }),
      this.registrationQuery.countTrackedAccounts(),
    ]);
    const page = paginator.extractPage(items);

    const ctx = this.viewContextFactory.create();
    const profiles = await Promise.all(
      page.items.map((item) => this.profileViews.view(item.did, ctx)),
    );

    return {
      cursor: page.cursor,
      total,
      trackedAccounts: page.items.flatMap((item, i) => {
        const profile = profiles[i];
        return profile
          ? [
              {
                profile,
                registeredFollowersCount: item.registeredFollowersCount,
              },
            ]
          : [];
      }),
    };
  }
}
