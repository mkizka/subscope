import type { InviteCode, TransactionContext } from "@repo/common/domain";

export interface IInviteCodeRepository {
  upsert: (params: {
    inviteCode: InviteCode;
    ctx: TransactionContext;
  }) => Promise<void>;
  findAll: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<InviteCode[]>;
  findFirst: (code: string) => Promise<InviteCode | null>;
}
