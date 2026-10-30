import { asDid, type Did } from "@atproto/did";
import type * as MeSubscoServerGetMembers from "@repo/client/lex/me/subsco/server/getMembers";

import type { ISubscriptionRepository } from "../../../application/interfaces/subscription-repository.js";
import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import type { SubscriptionService } from "../../../application/service/admin/subscription-service.js";
import { NotSubscribedError } from "../../../application/use-cases/sync/unsubscribe-server-use-case.js";

type GetMembersParams = {
  viewerDid: Did;
  limit: number;
  cursor?: string;
};

export class GetMembersUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly profileViewService: ProfileViewService,
  ) {}

  async execute(
    params: GetMembersParams,
  ): Promise<MeSubscoServerGetMembers.$OutputBody> {
    const viewer = await this.subscriptionRepository.findFirst(
      params.viewerDid,
    );
    if (!viewer) {
      throw new NotSubscribedError("Not subscribed to this server");
    }

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
