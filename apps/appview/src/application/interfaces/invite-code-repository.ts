import type { InviteCode } from "@repo/common/domain";

export interface IInviteCodeRepository {
  save: (inviteCode: InviteCode) => Promise<void>;
}
