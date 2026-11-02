import type * as AppBskyFeedGetRepostedBy from "@repo/client/lex/app/bsky/feed/getRepostedBy";

import type { RepostDto } from "../../../application/dto/repost-dto.js";
import type { IRepostQuery } from "../../../application/interfaces/repost-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetRepostedByUseCase {
  constructor(
    private readonly repostQuery: IRepostQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(
    params: AppBskyFeedGetRepostedBy.$Params,
  ): Promise<AppBskyFeedGetRepostedBy.$OutputBody> {
    const paginator = createCursorPaginator<RepostDto>({
      limit: params.limit,
      getCursor: (repost) => repost.sortAt.toISOString(),
    });
    const paginationResult = paginator.extractPage(
      await this.repostQuery.findBySubject({
        subjectUri: params.uri,
        limit: paginator.queryLimit,
        cursor: params.cursor ? new Date(params.cursor) : undefined,
      }),
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
