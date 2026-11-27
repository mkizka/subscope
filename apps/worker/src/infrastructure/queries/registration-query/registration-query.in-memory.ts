import type { TransactionContext } from "@repo/common/interface";

import type { IRegistrationQuery } from "../../../domain/interfaces/registration-query.js";

export class InMemoryRegistrationQuery implements IRegistrationQuery {
  private registrations: Set<string> = new Set();

  add(accountDid: string): void {
    this.registrations.add(accountDid);
  }

  clear(): void {
    this.registrations.clear();
  }

  async isMember(
    _ctx: TransactionContext,
    accountDid: string,
  ): Promise<boolean> {
    return this.registrations.has(accountDid);
  }

  async includesMember(_ctx: TransactionContext, dids: string[]) {
    return dids.some((did) => this.registrations.has(did));
  }

  async isFollowedByAnyServerMember(
    _ctx: TransactionContext,
    _subjectDid: string,
  ): Promise<boolean> {
    return false;
  }
}
