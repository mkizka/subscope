import { asDid, type Did } from "@atproto/did";
import type { $OutputBody } from "@repo/client/lex/app/bsky/graph/getFollowers";
import { required } from "@repo/common/utils";

import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import type { FollowService } from "../../../application/service/graph/follow-service.js";

export class GetFollowersUseCase {
  constructor(
    private readonly followService: FollowService,
    private readonly profileViewService: ProfileViewService,
  ) {}

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<$OutputBody> {
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
