import type { AppBskyFeedGetRepostedBy } from "@repo/client/server";

import type { ProfileViewService } from "@/server/features/xrpc/application/service/actor/profile-view-service.js";
import type { RepostService } from "@/server/features/xrpc/application/service/feed/repost-service.js";
import { toMapByDid } from "@/server/features/xrpc/application/utils/map.js";

export class GetRepostedByUseCase {
  constructor(
    private readonly repostService: RepostService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["repostService", "profileViewService"] as const;

  async execute(
    params: AppBskyFeedGetRepostedBy.QueryParams,
  ): Promise<AppBskyFeedGetRepostedBy.OutputSchema> {
    const cursor = params.cursor ? new Date(params.cursor) : undefined;

    const paginationResult = await this.repostService.findRepostsWithPagination(
      {
        subjectUri: params.uri,
        cursor,
        limit: params.limit,
      },
    );

    const actorDids = paginationResult.items.map((repost) => repost.actorDid);
    const profileViewMap = await this.profileViewService
      .findProfileView(actorDids)
      .then(toMapByDid);

    const repostedBy: AppBskyFeedGetRepostedBy.OutputSchema["repostedBy"] =
      paginationResult.items.map((repost) => {
        const profileView = profileViewMap.get(repost.actorDid);
        if (!profileView) {
          throw new Error(`Profile not found for actor: ${repost.actorDid}`);
        }
        return profileView;
      });

    return {
      uri: params.uri,
      cid: params.cid,
      cursor: paginationResult.cursor,
      repostedBy,
    };
  }
}
