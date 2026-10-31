import type { AtIdentifierString } from "@atproto/syntax";

import type {
  IListQuery,
  ListDto,
} from "@/app/server/infrastructure/list/list-query";

export interface IGetListsPageUseCase {
  execute: (did: string, actor: AtIdentifierString) => Promise<ListDto[]>;
}

export const getListsPageUseCaseFactory = ({
  listQuery,
}: {
  listQuery: IListQuery;
}): IGetListsPageUseCase => ({
  execute: (did, actor) => listQuery.findLists(did, actor),
});
