import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyFeedGetLikes from "@repo/client/lex/app/bsky/feed/getLikes";

import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import type { LikeService } from "../../../application/service/graph/like-service.js";
import { toMapByDid } from "../../../application/utils/map.js";

export class GetLikesUseCase {
  constructor(
    private readonly likeService: LikeService,
    private readonly profileViewService: ProfileViewService,
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

    const actorDids = paginationResult.items.map((like) => like.actorDid);
    const profileViewMap = await this.profileViewService
      .findProfileView(actorDids)
      .then(toMapByDid);

    const likes: AppBskyFeedGetLikes.Like[] = paginationResult.items.map(
      (like) => {
        const profileView = profileViewMap.get(like.actorDid);
        if (!profileView) {
          throw new Error(`Profile not found for actor: ${like.actorDid}`);
        }
        return {
          $type: "app.bsky.feed.getLikes#like",
          indexedAt: toDatetimeString(like.sortAt), // TODO: indexedAtに修正
          createdAt: toDatetimeString(like.createdAt),
          actor: profileView,
        };
      },
    );

    return {
      uri: params.uri,
      cid: params.cid,
      cursor: paginationResult.cursor,
      likes,
    };
  }
}
