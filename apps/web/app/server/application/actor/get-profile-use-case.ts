import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/lex/app/bsky/actor/defs";

import type { IActorQuery } from "@/app/server/infrastructure/actor/actor-query";

export interface IGetProfileUseCase {
  execute: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<ProfileViewDetailed>;
}

export const getProfileUseCaseFactory = ({
  actorQuery,
}: {
  actorQuery: IActorQuery;
}): IGetProfileUseCase => ({
  execute: (did, actor) => actorQuery.findProfile(did, actor),
});
