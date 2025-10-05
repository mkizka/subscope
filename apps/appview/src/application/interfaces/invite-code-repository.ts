import type { InviteCode, TransactionContext } from "@repo/common/domain";

export interface IInviteCodeRepository {
  save: (inviteCode: InviteCode) => Promise<void>;
  findAll: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<InviteCode[]>;
  findFirst: (code: string) => Promise<InviteCode | null>;
  markAsUsed: (params: {
    code: string;
    ctx: TransactionContext;
  }) => Promise<void>;
}
