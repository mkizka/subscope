import type * as AppBskyFeedGetRepostedBy from "@repo/client/lex/app/bsky/feed/getRepostedBy";

import type { RepostService } from "../../../application/service/feed/repost-service.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetRepostedByUseCase {
  constructor(
    private readonly repostService: RepostService,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(
    params: AppBskyFeedGetRepostedBy.$Params,
  ): Promise<AppBskyFeedGetRepostedBy.$OutputBody> {
    const cursor = params.cursor ? new Date(params.cursor) : undefined;

    const paginationResult = await this.repostService.findRepostsWithPagination(
      {
        subjectUri: params.uri,
        cursor,
        limit: params.limit,
      },
    );

    const ctx = this.viewContextFactory.create();
    const repostedBy = await Promise.all(
      paginationResult.items.map((repost) =>
        this.profileViews.view(repost.actorDid, ctx),
      ),
    );

    return {
      uri: params.uri,
      cid: params.cid,
      cursor: paginationResult.cursor,
      repostedBy: repostedBy.filter((profile) => profile !== undefined),
    };
  }
}
