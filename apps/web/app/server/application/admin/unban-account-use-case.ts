import type { DidString } from "@atproto/syntax";

import type { IAdminCommand } from "@/app/server/infrastructure/admin/admin-command";

export const unbanAccountUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string, target: DidString) =>
    adminCommand.unbanAccount(did, target);
