import { asDid } from "@atproto/did";
import type * as MeSubscoServerGetMembers from "@repo/client/lex/me/subsco/server/getMembers";

import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import type { SubscriptionService } from "../../../application/service/admin/subscription-service.js";

type GetMembersParams = {
  limit: number;
  cursor?: string;
};

export class GetMembersUseCase {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly profileViewService: ProfileViewService,
  ) {}

  async execute(
    params: GetMembersParams,
  ): Promise<MeSubscoServerGetMembers.$OutputBody> {
    const page = await this.subscriptionService.findSubscribersWithPagination({
      limit: params.limit,
      cursor: params.cursor,
    });
    const members = await this.profileViewService.findProfileView(
      page.items.map((sub) => asDid(sub.actorDid)),
    );

    return { cursor: page.cursor, members };
  }
}
