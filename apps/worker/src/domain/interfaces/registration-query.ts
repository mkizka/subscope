import type { TransactionContext } from "@repo/common/interface";

export interface IRegistrationQuery {
  isRegistered: (
    ctx: TransactionContext,
    accountDid: string,
  ) => Promise<boolean>;
  isFollowedByAnyServerMember: (
    ctx: TransactionContext,
    subjectDid: string,
  ) => Promise<boolean>;
}
