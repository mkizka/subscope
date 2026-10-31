import type { IAdminCommand } from "@/app/server/infrastructure/admin/admin-command";

export const deleteInviteCodeUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string, code: string) =>
    adminCommand.deleteInviteCode(did, code);
