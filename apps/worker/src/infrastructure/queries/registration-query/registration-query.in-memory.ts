import type { Registration, TransactionContext } from "@repo/common/domain";

import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";

export class InMemoryRegistrationQuery implements IRegistrationQuery {
  private registrations: Map<string, Registration> = new Map();

  add(registration: Registration): void {
    this.registrations.set(registration.accountDid, registration);
  }

  clear(): void {
    this.registrations.clear();
  }

  async isRegistered(
    _ctx: TransactionContext,
    accountDid: string,
  ): Promise<boolean> {
    return this.registrations.has(accountDid);
  }

  async isFollowedByAnyRegisteredAccount(
    _ctx: TransactionContext,
    _subjectDid: string,
  ): Promise<boolean> {
    return false;
  }
}
