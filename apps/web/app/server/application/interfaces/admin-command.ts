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
  grantAdmin: (did: string, target: DidString) => Promise<void>;
  removeMember: (did: string, target: DidString) => Promise<void>;
  createInviteCode: (did: string) => Promise<CreateInviteCodeOutput>;
  deleteInviteCode: (did: string, code: string) => Promise<void>;
}
