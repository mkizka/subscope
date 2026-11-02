import type { InviteCode, TransactionContext } from "@repo/common/domain";

export interface IInviteCodeRepository {
  upsert: (params: {
    inviteCode: InviteCode;
    ctx: TransactionContext;
  }) => Promise<void>;
  delete: (params: { code: string; ctx: TransactionContext }) => Promise<void>;
  findFirst: (code: string) => Promise<InviteCode | null>;
  markAsUsed: (params: {
    code: string;
    ctx: TransactionContext;
  }) => Promise<boolean>;
}
