import type { IAdminQuery } from "@/app/server/infrastructure/admin/admin-query";

export const getSubscribersUseCaseFactory =
  ({ adminQuery }: { adminQuery: IAdminQuery }) =>
  (did: string, cursor?: string) =>
    adminQuery.getSubscribers(did, cursor);
