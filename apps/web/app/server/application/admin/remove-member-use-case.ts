import type { DidString } from "@atproto/syntax";

import type { IAdminCommand } from "@/app/server/application/interfaces/admin-command";

export const removeMemberUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string, target: DidString) =>
    adminCommand.removeMember(did, target);
