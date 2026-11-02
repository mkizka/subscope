import { asDid } from "@atproto/did";
import type * as MeSubscoServerGetRegisteredAccounts from "@repo/client/lex/me/subsco/server/getRegisteredAccounts";
import type { Registration } from "@repo/common/domain";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";
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
    private readonly accountRepository: IAccountRepository,
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
      registeredAccounts: profiles
        .filter((profile) => profile !== undefined)
        .map((profile) => ({
          profile,
          isAdmin: adminDids.has(profile.did),
        })),
    };
  }
}
