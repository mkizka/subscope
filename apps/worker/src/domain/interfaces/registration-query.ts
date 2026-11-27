import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

export interface IRegistrationQuery {
  isMember: (ctx: TransactionContext, accountDid: string) => Promise<boolean>;
  includesMember: (ctx: TransactionContext, dids: string[]) => Promise<boolean>;
  isFollowedByAnyServerMember: (
    ctx: TransactionContext,
    subjectDid: string,
  ) => Promise<boolean>;
  findMemberDids: (ctx: TransactionContext) => Promise<Did[]>;
  findTrackedDids: (ctx: TransactionContext) => Promise<Did[]>;
}
