import type { DidString } from "@atproto/syntax";

import type { IAdminCommand } from "@/app/server/infrastructure/admin/admin-command";

export const banSubscriberUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string, target: DidString) =>
    adminCommand.banSubscriber(did, target);
