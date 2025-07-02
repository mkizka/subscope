import type { AppBskyFeedGetRepostedBy } from "@repo/client/server";

import type { ProfileViewService } from "../../service/view/profile-view-service.js";
import type { RepostService } from "../../service/view/repost-service.js";

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
    const profiles = await this.profileViewService.findProfileView(actorDids);
    const profileViewMap = new Map(
      profiles.map((profile) => [profile.did, profile]),
    );

    const repostedBy: AppBskyFeedGetRepostedBy.OutputSchema["repostedBy"] =
      paginationResult.items.map((repost) => {
        const profileView = profileViewMap.get(repost.actorDid.toString());
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
