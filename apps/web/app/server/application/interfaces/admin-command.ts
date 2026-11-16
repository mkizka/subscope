import type { AtIdentifierString, DidString } from "@atproto/syntax";

import type {
  AddMemberResult,
  CreateInviteCodeOutput,
} from "@/app/server/application/dto/admin";

export interface IAdminCommand {
  addMember: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<AddMemberResult>;
  banAccount: (did: string, target: DidString) => Promise<void>;
  grantAdmin: (did: string, target: DidString) => Promise<void>;
  unbanAccount: (did: string, target: DidString) => Promise<void>;
  createInviteCode: (did: string) => Promise<CreateInviteCodeOutput>;
  deleteInviteCode: (did: string, code: string) => Promise<void>;
}
