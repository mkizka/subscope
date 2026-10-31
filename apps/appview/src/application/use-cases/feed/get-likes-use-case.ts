import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyFeedGetLikes from "@repo/client/lex/app/bsky/feed/getLikes";

import type { LikeService } from "../../../application/service/graph/like-service.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetLikesUseCase {
  constructor(
    private readonly likeService: LikeService,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(
    params: AppBskyFeedGetLikes.$Params,
  ): Promise<AppBskyFeedGetLikes.$OutputBody> {
    const cursor = params.cursor ? new Date(params.cursor) : undefined;

    const paginationResult = await this.likeService.findLikesWithPagination({
      subjectUri: params.uri,
      cursor,
      limit: params.limit,
    });

    const ctx = this.viewContextFactory.create();
    const likes = await Promise.all(
      paginationResult.items.map(
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
      cursor: paginationResult.cursor,
      likes: likes.filter((like) => like !== undefined),
    };
  }
}
