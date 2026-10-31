import { asDid, type Did } from "@atproto/did";
import type { $OutputBody } from "@repo/client/lex/app/bsky/graph/getFollows";
import { required } from "@repo/common/utils";

import type { FollowService } from "../../../application/service/graph/follow-service.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetFollowsUseCase {
  constructor(
    private readonly followService: FollowService,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody> {
    const paginationResult = await this.followService.findFollowsWithPagination(
      {
        actorDid: params.actorDid,
        cursor: params.cursor,
        limit: params.limit,
      },
    );

    const ctx = this.viewContextFactory.create();
    const [subject, follows] = await Promise.all([
      this.profileViews.view(params.actorDid, ctx),
      Promise.all(
        paginationResult.items.map((item) =>
          this.profileViews.view(asDid(item.subjectDid), ctx),
        ),
      ),
    ]);

    return {
      subject: required(subject),
      cursor: paginationResult.cursor,
      follows: follows.filter((profile) => profile !== undefined),
    };
  }
}
