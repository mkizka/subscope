import { asDid } from "@atproto/did";
import { toDatetimeString } from "@atproto/syntax";
import type * as MeSubscoAdminListRegisteredAccounts from "@repo/client/lex/me/subsco/admin/listRegisteredAccounts";
import type { Registration } from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
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
    private readonly actorRepository: IActorRepository,
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
        const did = asDid(sub.actorDid);
        const [profile, actor] = await Promise.all([
          this.profileViews.view(did, ctx),
          this.actorRepository.find(did),
        ]);
        return (
          profile && {
            profile,
            isAdmin: actor?.isAdmin ?? false,
            registeredAt: toDatetimeString(sub.createdAt),
            backfillStatus: actor?.backfillStatus ?? "inProgress",
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
