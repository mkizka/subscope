import type { DidString } from "@atproto/syntax";

import type { CreateInviteCodeOutput } from "@/app/server/application/dto/admin";

export interface IAdminCommand {
  banAccount: (did: string, target: DidString) => Promise<void>;
  grantAdmin: (did: string, target: DidString) => Promise<void>;
  unbanAccount: (did: string, target: DidString) => Promise<void>;
  createInviteCode: (did: string) => Promise<CreateInviteCodeOutput>;
  deleteInviteCode: (did: string, code: string) => Promise<void>;
}
