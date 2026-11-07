import type { IAdminQuery } from "@/app/server/application/interfaces/admin-query";

export const listServerMembersUseCaseFactory =
  ({ adminQuery }: { adminQuery: IAdminQuery }) =>
  (did: string, cursor?: string) =>
    adminQuery.listServerMembers(did, cursor);
