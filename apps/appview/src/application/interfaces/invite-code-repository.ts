import type { InviteCode, TransactionContext } from "@repo/common/domain";

export interface IInviteCodeRepository {
  find: (params: {
    code: string;
    ctx: TransactionContext;
  }) => Promise<InviteCode | null>;
  save: (params: {
    inviteCode: InviteCode;
    ctx: TransactionContext;
  }) => Promise<void>;
  delete: (params: { code: string; ctx: TransactionContext }) => Promise<void>;
}
