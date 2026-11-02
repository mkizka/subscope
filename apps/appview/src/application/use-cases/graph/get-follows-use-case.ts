import type { Did } from "@atproto/did";
import type { $OutputBody } from "@repo/client/lex/app/bsky/graph/getFollows";
import { required } from "@repo/common/utils";

import type { FolloweeDto } from "../../../application/dto/follow-dto.js";
import type { IFollowQuery } from "../../../application/interfaces/follow-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetFollowsUseCase {
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
    const paginator = createCursorPaginator<FolloweeDto>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.followQuery.findActorFollows({
        actorDid: params.actorDid,
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
    );

    const ctx = this.viewContextFactory.create();
    const [subject, follows] = await Promise.all([
      this.profileViews.view(params.actorDid, ctx),
      Promise.all(
        page.items.map((item) =>
          this.profileViews.view(item.subjectDid, ctx),
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
