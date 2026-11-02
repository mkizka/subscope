import type { AtIdentifierString } from "@atproto/syntax";

import type { IAccountQuery } from "@/app/server/infrastructure/account/account-query";
import type {
  IListQuery,
  ListDto,
} from "@/app/server/infrastructure/list/list-query";

export interface IGetListsPageUseCase {
  execute: (
    did: string,
    account: AtIdentifierString,
  ) => Promise<{ lists: ListDto[]; isSelf: boolean }>;
}

export const getListsPageUseCaseFactory = ({
  listQuery,
  accountQuery,
}: {
  listQuery: IListQuery;
  accountQuery: IAccountQuery;
}): IGetListsPageUseCase => ({
  async execute(did, account) {
    const [lists, profile] = await Promise.all([
      listQuery.findLists(did, account),
      accountQuery.findProfile(did, account),
    ]);
    return { lists, isSelf: profile.did === did };
  },
});
