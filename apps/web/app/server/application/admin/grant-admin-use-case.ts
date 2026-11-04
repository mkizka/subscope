import type { DidString } from "@atproto/syntax";

import type { IAdminCommand } from "@/app/server/application/interfaces/admin-command";

export const grantAdminUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string, target: DidString) =>
    adminCommand.grantAdmin(did, target);
