import { asDid } from "@atproto/did";
import type * as MeSubscoServerGetServerMembers from "@repo/client/me/subsco/server/getServerMembers";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";
import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { Registration } from "../../../domain/models/registration.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type GetServerMembersParams = {
  limit: number;
  cursor?: string;
  q?: string;
};

export class GetServerMembersUseCase {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly accountRepository: IAccountRepository,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(
    params: GetServerMembersParams,
  ): Promise<MeSubscoServerGetServerMembers.$OutputBody> {
    const paginator = createCursorPaginator<Registration>({
      limit: params.limit,
      getCursor: (sub) => sub.createdAt.toISOString(),
    });
    const page = paginator.extractPage(
      await this.registrationQuery.findMany({
        limit: paginator.queryLimit,
        cursor: params.cursor,
        q: params.q,
      }),
    );
    const dids = page.items.map((sub) => asDid(sub.accountDid));
    const ctx = this.viewContextFactory.create();
    const [profiles, accounts] = await Promise.all([
      Promise.all(dids.map((did) => this.profileViews.view(did, ctx))),
      Promise.all(dids.map((did) => this.accountRepository.find(did))),
    ]);
    const adminDids = new Set(
      accounts
        .filter((account) => account?.isAdmin)
        .map((account) => account?.did),
    );

    return {
      cursor: page.cursor,
      serverMembers: profiles
        .filter((profile) => profile !== undefined)
        .map((profile) => ({
          profile,
          isAdmin: adminDids.has(profile.did),
        })),
    };
  }
}
