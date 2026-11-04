import type { IAdminQuery } from "@/app/server/application/interfaces/admin-query";

export const getBannedAccountsUseCaseFactory =
  ({ adminQuery }: { adminQuery: IAdminQuery }) =>
  (did: string, cursor?: string) =>
    adminQuery.getBannedAccounts(did, cursor);
