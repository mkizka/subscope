import type { Did } from "@atproto/did";
import type { $OutputBody } from "@repo/client/me/subsco/graph/getRegisteredFollowers";

import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import { createCursorPaginator } from "../../utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetRegisteredFollowersUseCase {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    accountDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody> {
    const paginator = createCursorPaginator<{ did: Did; sortAt: Date }>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });
    const [items, total] = await Promise.all([
      this.registrationQuery.findRegisteredFollowers({
        subjectDid: params.accountDid,
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
      this.registrationQuery.countRegisteredFollowers(params.accountDid),
    ]);
    const page = paginator.extractPage(items);

    const ctx = this.viewContextFactory.create();
    const followers = await Promise.all(
      page.items.map((item) => this.profileViews.view(item.did, ctx)),
    );

    return {
      cursor: page.cursor,
      total,
      followers: followers.filter((profile) => profile !== undefined),
    };
  }
}
