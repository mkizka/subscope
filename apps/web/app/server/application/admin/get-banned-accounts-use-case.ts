import type { IAdminQuery } from "@/app/server/infrastructure/admin/admin-query";

export const getBannedAccountsUseCaseFactory =
  ({ adminQuery }: { adminQuery: IAdminQuery }) =>
  (did: string, cursor?: string) =>
    adminQuery.getBannedAccounts(did, cursor);
