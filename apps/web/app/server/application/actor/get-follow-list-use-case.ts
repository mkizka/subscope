import type { AtIdentifierString } from "@atproto/syntax";

import type {
  FollowListDto,
  IActorQuery,
} from "@/app/server/infrastructure/actor/actor-query";

export interface IGetFollowListUseCase {
  execute: (
    did: string,
    actor: AtIdentifierString,
    kind: "follows" | "followers",
  ) => Promise<FollowListDto>;
}

export const getFollowListUseCaseFactory = ({
  actorQuery,
}: {
  actorQuery: IActorQuery;
}): IGetFollowListUseCase => ({
  execute: (did, actor, kind) => actorQuery.findFollowList(did, actor, kind),
});
