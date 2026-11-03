import { asDid } from "@atproto/did";
import { toDatetimeString } from "@atproto/syntax";
import type * as MeSubscoAdminListRegisteredAccounts from "@repo/client/lex/me/subsco/admin/listRegisteredAccounts";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";
import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { Registration } from "../../../domain/models/registration.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type ListRegisteredAccountsParams = {
  limit: number;
  cursor?: string;
};

export class ListRegisteredAccountsUseCase {
  constructor(
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
    private readonly accountRepository: IAccountRepository,
    private readonly registrationQuery: IRegistrationQuery,
  ) {}

  async execute(
    params: ListRegisteredAccountsParams,
  ): Promise<MeSubscoAdminListRegisteredAccounts.$OutputBody> {
    const paginator = createCursorPaginator<Registration>({
      limit: params.limit,
      getCursor: (sub) => sub.createdAt.toISOString(),
    });
    const [registrations, total] = await Promise.all([
      this.registrationQuery.findMany({
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
      this.registrationQuery.count(),
    ]);
    const paginationResult = paginator.extractPage(registrations);

    const ctx = this.viewContextFactory.create({ includeTakedowns: true });
    const registeredAccounts = await Promise.all(
      paginationResult.items.map(async (sub) => {
        const did = asDid(sub.accountDid);
        const [profile, account] = await Promise.all([
          this.profileViews.view(did, ctx),
          this.accountRepository.find(did),
        ]);
        return (
          profile && {
            profile,
            isAdmin: account?.isAdmin ?? false,
            registeredAt: toDatetimeString(sub.createdAt),
            backfillStatus: account?.backfillStatus ?? "inProgress",
          }
        );
      }),
    );

    return {
      cursor: paginationResult.cursor,
      total,
      registeredAccounts: registeredAccounts.filter((sub) => sub !== undefined),
    };
  }
}
