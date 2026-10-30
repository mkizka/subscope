import { asDid } from "@atproto/did";
import type * as MeSubscoServerGetMembers from "@repo/client/lex/me/subsco/server/getMembers";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
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
    private readonly actorRepository: IActorRepository,
  ) {}

  async execute(
    params: GetMembersParams,
  ): Promise<MeSubscoServerGetMembers.$OutputBody> {
    const page = await this.subscriptionService.findSubscribersWithPagination({
      limit: params.limit,
      cursor: params.cursor,
    });
    const dids = page.items.map((sub) => asDid(sub.actorDid));
    const [profiles, actors] = await Promise.all([
      this.profileViewService.findProfileView(dids),
      Promise.all(dids.map((did) => this.actorRepository.findByDid(did))),
    ]);
    const adminDids = new Set(
      actors.filter((actor) => actor?.isAdmin).map((actor) => actor?.did),
    );

    return {
      cursor: page.cursor,
      members: profiles.map((profile) => ({
        profile,
        isAdmin: adminDids.has(profile.did),
      })),
    };
  }
}
