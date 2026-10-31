import type { IAdminQuery } from "@/app/server/infrastructure/admin/admin-query";

export const getInviteCodesUseCaseFactory =
  ({ adminQuery }: { adminQuery: IAdminQuery }) =>
  (did: string, cursor?: string) =>
    adminQuery.getInviteCodes(did, cursor);
