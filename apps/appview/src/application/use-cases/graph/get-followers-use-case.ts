import { asDid, type Did } from "@atproto/did";
import type { $OutputBody } from "@repo/client/lex/app/bsky/graph/getFollowers";
import type { Follow } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import type { IFollowQuery } from "../../../application/interfaces/follow-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetFollowersUseCase {
  constructor(
    private readonly followQuery: IFollowQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody> {
    const paginator = createCursorPaginator<Follow>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.followQuery.findActorFollowers({
        actorDid: params.actorDid,
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
    );

    const ctx = this.viewContextFactory.create();
    const [subject, followers] = await Promise.all([
      this.profileViews.view(params.actorDid, ctx),
      Promise.all(
        page.items.map((item) =>
          this.profileViews.view(asDid(item.actorDid), ctx),
        ),
      ),
    ]);

    return {
      subject: required(subject),
      cursor: page.cursor,
      followers: followers.filter((profile) => profile !== undefined),
    };
  }
}
