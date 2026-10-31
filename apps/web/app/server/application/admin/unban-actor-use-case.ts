import type { DidString } from "@atproto/syntax";

import type { IAdminCommand } from "@/app/server/infrastructure/admin/admin-command";

export const unbanActorUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string, target: DidString) =>
    adminCommand.unbanActor(did, target);
