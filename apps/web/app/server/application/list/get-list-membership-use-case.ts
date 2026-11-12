import type { DidString } from "@atproto/syntax";

import type { ListDto } from "@/app/server/application/dto/list";
import type { IListQuery } from "@/app/server/application/interfaces/list-query";

export interface IGetListMembershipUseCase {
  execute: (
    did: string,
    subjectDid: DidString,
  ) => Promise<{ lists: (ListDto & { listItemUri?: string })[] }>;
}

export const getListMembershipUseCaseFactory = ({
  listQuery,
}: {
  listQuery: IListQuery;
}): IGetListMembershipUseCase => ({
  async execute(did, subjectDid) {
    const items = await listQuery.findListsWithMembership(did, subjectDid);
    return {
      lists: items.map(({ list, listItemUri }) => ({ ...list, listItemUri })),
    };
  },
});
