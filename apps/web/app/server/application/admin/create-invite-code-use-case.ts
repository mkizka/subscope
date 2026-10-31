import type { IAdminCommand } from "@/app/server/infrastructure/admin/admin-command";

export const createInviteCodeUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string) =>
    adminCommand.createInviteCode(did);
