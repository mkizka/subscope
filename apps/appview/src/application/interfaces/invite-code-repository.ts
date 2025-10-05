import type { InviteCode } from "@repo/common/domain";

export interface IInviteCodeRepository {
  save: (inviteCode: InviteCode) => Promise<void>;
  findAll: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<InviteCode[]>;
  findFirst: (code: string) => Promise<InviteCode | null>;
  markAsUsed: (code: string) => Promise<void>;
}
