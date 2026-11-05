import type { IAdminCommand } from "@/app/server/application/interfaces/admin-command";

export const deleteInviteCodeUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string, code: string) =>
    adminCommand.deleteInviteCode(did, code);
