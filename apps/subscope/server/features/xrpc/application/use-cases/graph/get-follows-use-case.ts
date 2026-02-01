import { asDid, type Did } from "@atproto/did";
import type { AppBskyGraphGetFollows } from "@repo/client/server";
import { required } from "@repo/common/utils";

import type { ProfileViewService } from "@/server/features/xrpc/application/service/actor/profile-view-service.js";
import type { FollowService } from "@/server/features/xrpc/application/service/graph/follow-service.js";

export class GetFollowsUseCase {
  constructor(
    private readonly followService: FollowService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["followService", "profileViewService"] as const;

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<AppBskyGraphGetFollows.OutputSchema> {
    const paginationResult = await this.followService.findFollowsWithPagination(
      {
        actorDid: params.actorDid,
        cursor: params.cursor,
        limit: params.limit,
      },
    );

    const subjectDids = paginationResult.items.map((item) =>
      asDid(item.subjectDid),
    );
    const [subject] = await this.profileViewService.findProfileView([
      params.actorDid,
    ]);
    const follows = await this.profileViewService.findProfileView(subjectDids);

    return {
      subject: required(subject),
      cursor: paginationResult.cursor,
      follows,
    };
  }
}
