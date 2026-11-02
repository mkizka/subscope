import type { InviteCode, TransactionContext } from "@repo/common/domain";

import type { InviteCodeDto } from "../../application/dto/invite-code-dto.js";

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
  findAll: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<InviteCodeDto[]>;
}
