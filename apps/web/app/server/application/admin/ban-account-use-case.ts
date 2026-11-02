import type { DidString } from "@atproto/syntax";

import type { IAdminCommand } from "@/app/server/infrastructure/admin/admin-command";

export const banAccountUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string, target: DidString) =>
    adminCommand.banAccount(did, target);
