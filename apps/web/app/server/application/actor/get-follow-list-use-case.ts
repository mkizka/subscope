import type { AtIdentifierString } from "@atproto/syntax";

import type {
  FollowListDto,
  IActorQuery,
} from "@/app/server/infrastructure/actor/actor-query";
import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";

export interface IGetFollowListUseCase {
  execute: (
    did: string,
    actor: AtIdentifierString,
    kind: "follows" | "followers",
  ) => Promise<FollowListDto>;
}

export const getFollowListUseCaseFactory = ({
  actorQuery,
  backfillQuery,
}: {
  actorQuery: IActorQuery;
  backfillQuery: IBackfillQuery;
}): IGetFollowListUseCase => ({
  async execute(did, actor, kind) {
    const list = await actorQuery.findFollowList(did, actor, kind);
    const statuses = await backfillQuery.findTrackedStatuses(
      list.actors.map((item) => item.did),
    );
    return {
      ...list,
      actors: list.actors.map((item) => ({
        ...item,
        backfillStatus: statuses[item.did],
      })),
    };
  },
});
