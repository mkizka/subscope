import type { Did } from "@atproto/did";
import type { $OutputBody } from "@repo/client/app/bsky/graph/getKnownFollowers";
import { required } from "@repo/common/utils";

import type { FollowerDto } from "../../../application/dto/follow-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IFollowQuery } from "../../interfaces/queries/follow-query.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetKnownFollowersUseCase {
  constructor(
    private readonly followQuery: IFollowQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    viewerDid: Did;
    subjectDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody> {
    const paginator = createCursorPaginator<FollowerDto>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.followQuery.findKnownFollowers({
        viewerDid: params.viewerDid,
        subjectDid: params.subjectDid,
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
    );

    const ctx = this.viewContextFactory.create({ viewerDid: params.viewerDid });
    const [subject, followers] = await Promise.all([
      this.profileViews.view(params.subjectDid, ctx),
      Promise.all(
        page.items.map((item) => this.profileViews.view(item.accountDid, ctx)),
      ),
    ]);

    return {
      subject: required(subject),
      cursor: page.cursor,
      followers: followers.filter((profile) => profile !== undefined),
    };
  }
}
