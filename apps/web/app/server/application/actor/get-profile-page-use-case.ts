import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/lex/app/bsky/actor/defs";

import type {
  IActorQuery,
  ProfileTab,
} from "@/app/server/infrastructure/actor/actor-query";
import type { TimelinePostDto } from "@/app/server/infrastructure/timeline/timeline-query";

export interface IGetProfilePageUseCase {
  execute: (
    did: string,
    actor: AtIdentifierString,
    tab: ProfileTab,
  ) => Promise<{
    profile: ProfileViewDetailed;
    isSelf: boolean;
    posts: TimelinePostDto[];
    tab: ProfileTab;
  }>;
}

export const getProfilePageUseCaseFactory = ({
  actorQuery,
}: {
  actorQuery: IActorQuery;
}): IGetProfilePageUseCase => ({
  async execute(did, actor, tab) {
    const [profile, posts] = await Promise.all([
      actorQuery.findProfile(did, actor),
      actorQuery.findPosts(did, actor, tab),
    ]);
    return { profile, isSelf: profile.did === did, posts, tab };
  },
});
