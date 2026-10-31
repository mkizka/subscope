import type { IAdminQuery } from "@/app/server/infrastructure/admin/admin-query";

export const getBannedActorsUseCaseFactory =
  ({ adminQuery }: { adminQuery: IAdminQuery }) =>
  (did: string, cursor?: string) =>
    adminQuery.getBannedActors(did, cursor);
