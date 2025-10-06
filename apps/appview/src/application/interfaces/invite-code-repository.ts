import type { InviteCode, TransactionContext } from "@repo/common/domain";

import type { InviteCodeDto } from "../dto/invite-code-with-handle.js";

export interface IInviteCodeRepository {
  upsert: (params: {
    inviteCode: InviteCode;
    ctx: TransactionContext;
  }) => Promise<void>;
  findAll: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<InviteCodeDto[]>;
  findFirst: (code: string) => Promise<InviteCode | null>;
}
