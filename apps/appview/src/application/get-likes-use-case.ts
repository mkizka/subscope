import type { AppBskyFeedGetLikes } from "@repo/client/server";

import { PaginationQuery } from "../domain/models/pagination-query.js";
import type { LikeService } from "./service/like-service.js";
import type { ProfileViewService } from "./service/profile-view-service.js";

export class GetLikesUseCase {
  constructor(
    private readonly likeService: LikeService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["likeService", "profileViewService"] as const;

  async execute(
    params: AppBskyFeedGetLikes.QueryParams,
  ): Promise<AppBskyFeedGetLikes.OutputSchema> {
    const query = PaginationQuery.create(
      { subjectUri: params.uri },
      {
        cursor: params.cursor,
        limit: params.limit,
      },
    );

    const paginationResult =
      await this.likeService.findLikesWithPagination(query);

    const actorDids = paginationResult.items.map((like) => like.actorDid);
    const profiles = await this.profileViewService.findProfileView(actorDids);
    const profileViewMap = new Map(
      profiles.map((profile) => [profile.did, profile]),
    );

    const likes: AppBskyFeedGetLikes.Like[] = paginationResult.items.map(
      (like) => {
        const profileView = profileViewMap.get(like.actorDid.toString());
        if (!profileView) {
          throw new Error(`Profile not found for actor: ${like.actorDid}`);
        }
        return {
          $type: "app.bsky.feed.getLikes#like",
          indexedAt: like.sortAt.toISOString(), // TODO: indexedAtに修正
          createdAt: like.createdAt.toISOString(),
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
