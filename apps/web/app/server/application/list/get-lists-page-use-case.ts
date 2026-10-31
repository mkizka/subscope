import type { AtIdentifierString } from "@atproto/syntax";

import type { IActorQuery } from "@/app/server/infrastructure/actor/actor-query";
import type {
  IListQuery,
  ListDto,
} from "@/app/server/infrastructure/list/list-query";

export interface IGetListsPageUseCase {
  execute: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<{ lists: ListDto[]; isSelf: boolean }>;
}

export const getListsPageUseCaseFactory = ({
  listQuery,
  actorQuery,
}: {
  listQuery: IListQuery;
  actorQuery: IActorQuery;
}): IGetListsPageUseCase => ({
  async execute(did, actor) {
    const [lists, profile] = await Promise.all([
      listQuery.findLists(did, actor),
      actorQuery.findProfile(did, actor),
    ]);
    return { lists, isSelf: profile.did === did };
  },
});
