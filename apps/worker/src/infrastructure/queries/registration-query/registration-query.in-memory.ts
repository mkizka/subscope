import type { TransactionContext } from "@repo/common/interface";

import type { IRegistrationQuery } from "../../../domain/interfaces/registration-query.js";

export class InMemoryRegistrationQuery implements IRegistrationQuery {
  private registrations: Set<string> = new Set();
  private followed: Set<string> = new Set();

  add(accountDid: string): void {
    this.registrations.add(accountDid);
  }

  addFollowed(subjectDid: string): void {
    this.followed.add(subjectDid);
  }

  clear(): void {
    this.registrations.clear();
    this.followed.clear();
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
    subjectDid: string,
  ): Promise<boolean> {
    return this.followed.has(subjectDid);
  }
}
