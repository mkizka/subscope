import type { AtIdentifierString } from "@atproto/syntax";

import type { IAdminCommand } from "@/app/server/application/interfaces/admin-command";

export const addMemberUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string, actor: AtIdentifierString) =>
    adminCommand.addMember(did, actor);
