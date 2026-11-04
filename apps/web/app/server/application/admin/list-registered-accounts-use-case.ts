import type { IAdminQuery } from "@/app/server/application/interfaces/admin-query";

export const listRegisteredAccountsUseCaseFactory =
  ({ adminQuery }: { adminQuery: IAdminQuery }) =>
  (did: string, cursor?: string) =>
    adminQuery.listRegisteredAccounts(did, cursor);
