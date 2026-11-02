import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyFeedGetLikes from "@repo/client/lex/app/bsky/feed/getLikes";

import type { SubjectLikeDto } from "../../../application/dto/like-dto.js";
import type { ILikeQuery } from "../../../application/interfaces/like-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetLikesUseCase {
  constructor(
    private readonly likeQuery: ILikeQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(
    params: AppBskyFeedGetLikes.$Params,
  ): Promise<AppBskyFeedGetLikes.$OutputBody> {
    const paginator = createCursorPaginator<SubjectLikeDto>({
      limit: params.limit,
      getCursor: (like) => like.sortAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.likeQuery.findSubjectLikes({
        subjectUri: params.uri,
        limit: paginator.queryLimit,
        cursor: params.cursor ? new Date(params.cursor) : undefined,
      }),
    );

    const ctx = this.viewContextFactory.create();
    const likes = await Promise.all(
      page.items.map(
        async (like): Promise<AppBskyFeedGetLikes.Like | undefined> => {
          const actor = await this.profileViews.view(like.actorDid, ctx);
          return (
            actor && {
              $type: "app.bsky.feed.getLikes#like",
              indexedAt: toDatetimeString(like.sortAt), // TODO: indexedAtに修正
              createdAt: toDatetimeString(like.createdAt),
              actor,
            }
          );
        },
      ),
    );

    return {
      uri: params.uri,
      cid: params.cid,
      cursor: page.cursor,
      likes: likes.filter((like) => like !== undefined),
    };
  }
}
