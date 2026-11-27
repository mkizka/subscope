import type { ITransactionManager } from "@repo/common/interface";

import type { AccountRoster } from "../../../domain/account-roster.js";
import type { IRegistrationQuery } from "../../../domain/interfaces/registration-query.js";

export class RefreshAccountRosterUseCase {
  constructor(
    private readonly deps: {
      registrationQuery: IRegistrationQuery;
      accountRoster: AccountRoster;
      transactionManager: ITransactionManager;
    },
  ) {}

  async execute() {
    const roster = await this.deps.transactionManager.transaction(
      async (ctx) => ({
        memberDids: await this.deps.registrationQuery.findMemberDids(ctx),
        trackedDids: await this.deps.registrationQuery.findTrackedDids(ctx),
      }),
    );
    this.deps.accountRoster.replace(roster);
  }
}
