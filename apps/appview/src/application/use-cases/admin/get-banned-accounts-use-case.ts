import type { Did } from "@atproto/did";
import type * as MeSubscoAdminGetBannedAccounts from "@repo/client/lex/me/subsco/admin/getBannedAccounts";

import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IAccountQuery } from "../../interfaces/queries/account-query.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetBannedAccountsUseCase {
  constructor(
    private readonly accountQuery: IAccountQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(params: {
    limit: number;
    cursor?: string;
  }): Promise<MeSubscoAdminGetBannedAccounts.$OutputBody> {
    const paginator = createCursorPaginator<Did>({
      limit: params.limit,
      getCursor: (did) => did,
    });
    const page = paginator.extractPage(
      await this.accountQuery.findBannedDids({
        limit: paginator.queryLimit,
        cursor: params.cursor,
      }),
    );
    const ctx = this.viewContextFactory.create({ includeTakedowns: true });
    const accounts = await Promise.all(
      page.items.map((did) => this.profileViews.view(did, ctx)),
    );

    return {
      cursor: page.cursor,
      actors: accounts.filter((account) => account !== undefined),
    };
  }
}
