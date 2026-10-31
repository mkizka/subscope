import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/lex/app/bsky/actor/defs";

import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import type { IActorRepository } from "@/app/server/infrastructure/actor/actor-repository";

export interface IGetProfilePageUseCase {
  execute: (
    did: string,
    actor: AtIdentifierString,
  ) => Promise<{
    profile: ProfileViewDetailed;
    isSelf: boolean;
    posts: TimelinePost[];
  }>;
}

export const getProfilePageUseCaseFactory = ({
  actorRepository,
}: {
  actorRepository: IActorRepository;
}): IGetProfilePageUseCase => ({
  async execute(did, actor) {
    const [profile, posts] = await Promise.all([
      actorRepository.findProfile(did, actor),
      actorRepository.findPosts(did, actor),
    ]);
    return { profile, isSelf: profile.did === did, posts };
  },
});
