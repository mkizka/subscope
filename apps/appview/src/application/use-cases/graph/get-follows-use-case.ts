import type { Did } from "@atproto/did";
import type { $OutputBody } from "@repo/client/app/bsky/graph/getFollows";
import { required } from "@repo/common/utils";

import type { FolloweeDto } from "../../../application/dto/follow-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IFollowQuery } from "../../interfaces/queries/follow-query.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetFollowsUseCase {
  constructor(
    private readonly deps: {
      followQuery: IFollowQuery;
      viewContextFactory: ViewContextFactory;
      profileViews: ProfileViews;
    },
  ) {}

  async execute(params: {
    accountDid: Did;
    viewerDid: Did | null;
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody> {
    const paginator = createCursorPaginator<FolloweeDto>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.deps.followQuery.findAccountFollows({
        accountDid: params.accountDid,
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
    );

    const ctx = this.deps.viewContextFactory.create({
      viewerDid: params.viewerDid,
    });
    const [subject, follows] = await Promise.all([
      this.deps.profileViews.view(params.accountDid, ctx),
      Promise.all(
        page.items.map((item) =>
          this.deps.profileViews.view(item.subjectDid, ctx),
        ),
      ),
    ]);

    return {
      subject: required(subject),
      cursor: page.cursor,
      follows: follows.filter((profile) => profile !== undefined),
    };
  }
}
