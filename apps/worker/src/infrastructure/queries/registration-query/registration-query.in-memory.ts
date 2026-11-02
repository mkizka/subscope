import type { Registration, TransactionContext } from "@repo/common/domain";

import type { IRegistrationQuery } from "../../../application/interfaces/queries/registration-query.js";

export class InMemoryRegistrationQuery implements IRegistrationQuery {
  private registrations: Map<string, Registration> = new Map();

  add(registration: Registration): void {
    this.registrations.set(registration.actorDid, registration);
  }

  clear(): void {
    this.registrations.clear();
  }

  async isRegistered(
    _ctx: TransactionContext,
    actorDid: string,
  ): Promise<boolean> {
    return this.registrations.has(actorDid);
  }

  async isFollowedByAnyRegisteredAccount(
    _ctx: TransactionContext,
    _subjectDid: string,
  ): Promise<boolean> {
    return false;
  }
}
