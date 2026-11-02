import { asDid } from "@atproto/did";
import type * as MeSubscoServerGetRegisteredAccounts from "@repo/client/lex/me/subsco/server/getRegisteredAccounts";
import type { Registration } from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type GetRegisteredAccountsParams = {
  limit: number;
  cursor?: string;
};

export class GetRegisteredAccountsUseCase {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly actorRepository: IActorRepository,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(
    params: GetRegisteredAccountsParams,
  ): Promise<MeSubscoServerGetRegisteredAccounts.$OutputBody> {
    const paginator = createCursorPaginator<Registration>({
      limit: params.limit,
      getCursor: (sub) => sub.createdAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.registrationQuery.findMany({
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
      registeredAccounts: profiles
        .filter((profile) => profile !== undefined)
        .map((profile) => ({
          profile,
          isAdmin: adminDids.has(profile.did),
        })),
    };
  }
}
