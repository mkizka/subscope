import type { DidString } from "@atproto/syntax";

import type { IAdminCommand } from "@/app/server/application/interfaces/admin-command";

export const banAccountUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string, target: DidString) =>
    adminCommand.banAccount(did, target);
