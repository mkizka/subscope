import type { IAdminQuery } from "@/app/server/application/interfaces/admin-query";

export const getInviteCodesUseCaseFactory =
  ({ adminQuery }: { adminQuery: IAdminQuery }) =>
  (did: string, cursor?: string) =>
    adminQuery.getInviteCodes(did, cursor);
