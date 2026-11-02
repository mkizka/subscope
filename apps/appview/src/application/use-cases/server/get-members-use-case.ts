import { asDid } from "@atproto/did";
import type * as MeSubscoServerGetMembers from "@repo/client/lex/me/subsco/server/getMembers";
import type { Subscription } from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { ISubscriptionQuery } from "../../../application/interfaces/subscription-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type GetMembersParams = {
  limit: number;
  cursor?: string;
};

export class GetMembersUseCase {
  constructor(
    private readonly subscriptionQuery: ISubscriptionQuery,
    private readonly actorRepository: IActorRepository,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(
    params: GetMembersParams,
  ): Promise<MeSubscoServerGetMembers.$OutputBody> {
    const paginator = createCursorPaginator<Subscription>({
      limit: params.limit,
      getCursor: (sub) => sub.createdAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.subscriptionQuery.findMany({
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
    );
    const dids = page.items.map((sub) => asDid(sub.actorDid));
    const ctx = this.viewContextFactory.create();
    const [profiles, actors] = await Promise.all([
      Promise.all(dids.map((did) => this.profileViews.view(did, ctx))),
      Promise.all(dids.map((did) => this.actorRepository.find(did))),
    ]);
    const adminDids = new Set(
      actors.filter((actor) => actor?.isAdmin).map((actor) => actor?.did),
    );

    return {
      cursor: page.cursor,
      members: profiles
        .filter((profile) => profile !== undefined)
        .map((profile) => ({
          profile,
          isAdmin: adminDids.has(profile.did),
        })),
    };
  }
}
