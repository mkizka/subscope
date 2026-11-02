import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/lex/app/bsky/actor/defs";
import type { BackfillStatus } from "@repo/common/domain";

import type {
  IActorQuery,
  ProfileTab,
} from "@/app/server/infrastructure/actor/actor-query";
import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";
import type { TimelinePostDto } from "@/app/server/infrastructure/timeline/timeline-query";

export interface IGetProfilePageUseCase {
  execute: (
    did: string,
    actor: AtIdentifierString,
    tab: ProfileTab,
  ) => Promise<{
    profile: ProfileViewDetailed;
    isSelf: boolean;
    backfillStatus?: BackfillStatus;
    posts: TimelinePostDto[];
    tab: ProfileTab;
  }>;
}

export const getProfilePageUseCaseFactory = ({
  actorQuery,
  backfillQuery,
}: {
  actorQuery: IActorQuery;
  backfillQuery: IBackfillQuery;
}): IGetProfilePageUseCase => ({
  async execute(did, actor, tab) {
    const [profile, posts] = await Promise.all([
      actorQuery.findProfile(did, actor),
      actorQuery.findPosts(did, actor, tab),
    ]);
    const statuses = await backfillQuery.findTrackedStatuses([profile.did]);
    return {
      profile,
      isSelf: profile.did === did,
      backfillStatus: statuses[profile.did],
      posts,
      tab,
    };
  },
});
