import type * as AppBskyFeedGetRepostedBy from "@repo/client/app/bsky/feed/getRepostedBy";

import type { RepostDto } from "../../../application/dto/repost-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IRepostQuery } from "../../interfaces/queries/repost-query.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory, Viewer } from "../../views/view-context.js";

export class GetRepostedByUseCase {
  constructor(
    private readonly deps: {
      repostQuery: IRepostQuery;
      viewContextFactory: ViewContextFactory;
      profileViews: ProfileViews;
    },
  ) {}

  async execute(
    params: AppBskyFeedGetRepostedBy.$Params,
    viewer: Viewer,
  ): Promise<AppBskyFeedGetRepostedBy.$OutputBody> {
    const paginator = createCursorPaginator<RepostDto>({
      limit: params.limit,
      getCursor: (repost) => repost.sortAt.toISOString(),
    });
    const paginationResult = paginator.extractPage(
      await this.deps.repostQuery.findBySubject({
        subjectUri: params.uri,
        limit: paginator.queryLimit,
        cursor: params.cursor ? new Date(params.cursor) : undefined,
      }),
    );

    const ctx = this.deps.viewContextFactory.create(viewer);
    const repostedBy = await Promise.all(
      paginationResult.items.map((repost) =>
        this.deps.profileViews.view(repost.accountDid, ctx),
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
