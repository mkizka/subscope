import type { IAdminCommand } from "@/app/server/application/interfaces/admin-command";

export const createInviteCodeUseCaseFactory =
  ({ adminCommand }: { adminCommand: IAdminCommand }) =>
  (did: string) =>
    adminCommand.createInviteCode(did);
