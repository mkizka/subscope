import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/lex/app/bsky/actor/defs";

import type { IActorRepository } from "@/app/server/infrastructure/actor/actor-repository";

export interface IGetProfileUseCase {
  execute: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<ProfileViewDetailed>;
}

export const getProfileUseCaseFactory = ({
  actorRepository,
}: {
  actorRepository: IActorRepository;
}): IGetProfileUseCase => ({
  execute: (did, actor) => actorRepository.findProfile(did, actor),
});
