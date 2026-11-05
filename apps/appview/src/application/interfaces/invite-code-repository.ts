import type { TransactionContext } from "@repo/common/interface";

import type { InviteCode } from "../../domain/models/invite-code.js";

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
