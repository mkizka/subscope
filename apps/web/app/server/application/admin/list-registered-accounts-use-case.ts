import type { IAdminQuery } from "@/app/server/infrastructure/admin/admin-query";

export const listRegisteredAccountsUseCaseFactory =
  ({ adminQuery }: { adminQuery: IAdminQuery }) =>
  (did: string, cursor?: string) =>
    adminQuery.listRegisteredAccounts(did, cursor);
