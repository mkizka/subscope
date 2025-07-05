import { asDid, type Did } from "@atproto/did";
import type { AppBskyGraphGetFollowers } from "@repo/client/server";
import { required } from "@repo/common/utils";

import type { FollowService } from "../../service/graph/follow-service.js";
import type { ProfileViewService } from "../../service/view/profile-view-service.js";

export class GetFollowersUseCase {
  constructor(
    private readonly followService: FollowService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["followService", "profileViewService"] as const;

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<AppBskyGraphGetFollowers.OutputSchema> {
    const paginationResult =
      await this.followService.findFollowersWithPagination({
        actorDid: params.actorDid,
        cursor: params.cursor,
        limit: params.limit,
      });

    const actorDids = paginationResult.items.map((item) =>
      asDid(item.actorDid),
    );
    const [subject] = await this.profileViewService.findProfileView([
      params.actorDid,
    ]);
    const followers = await this.profileViewService.findProfileView(actorDids);

    return {
      subject: required(subject),
      cursor: paginationResult.cursor,
      followers,
    };
  }
}
