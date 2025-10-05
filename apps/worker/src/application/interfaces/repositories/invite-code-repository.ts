import type { InviteCode, TransactionContext } from "@repo/common/domain";

export interface IInviteCodeRepository {
  findByCode: (
    ctx: TransactionContext,
    code: string,
  ) => Promise<InviteCode | null>;
  markAsUsed: (ctx: TransactionContext, code: string) => Promise<void>;
}
