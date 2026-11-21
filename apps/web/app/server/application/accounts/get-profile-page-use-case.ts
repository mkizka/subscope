import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/app/bsky/actor/defs";

import type { BackfillStatus } from "@/app/lib/backfill-status";
import type { ProfileTab } from "@/app/server/application/dto/account";
import type { TimelinePostDto } from "@/app/server/application/dto/timeline-post-dto";
import type { IAccountQuery } from "@/app/server/application/interfaces/account-query";
import type { IBackfillQuery } from "@/app/server/application/interfaces/backfill-query";
import type { ISubscopeQuery } from "@/app/server/application/interfaces/subscope-query";

export interface IGetProfilePageUseCase {
  execute: (
    did: string,
    account: AtIdentifierString,
    tab: ProfileTab,
    cursor?: string,
  ) => Promise<{
    profile: ProfileViewDetailed;
    isSelf: boolean;
    isMember: boolean;
    backfillStatus?: BackfillStatus;
    posts: TimelinePostDto[];
    cursor?: string;
  }>;
}

export const getProfilePageUseCaseFactory = ({
  accountQuery,
  backfillQuery,
  subscopeQuery,
}: {
  accountQuery: IAccountQuery;
  backfillQuery: IBackfillQuery;
  subscopeQuery: ISubscopeQuery;
}): IGetProfilePageUseCase => ({
  async execute(did, account, tab, cursor) {
    const [profile, { posts, cursor: next }] = await Promise.all([
      accountQuery.findProfile(did, account),
      accountQuery.findPosts(did, account, tab, cursor),
    ]);
    const [statuses, isMember] = await Promise.all([
      backfillQuery.findTrackedStatuses([profile.did]),
      subscopeQuery.isMember(profile.did),
    ]);
    return {
      profile,
      isSelf: profile.did === did,
      isMember,
      backfillStatus: statuses[profile.did],
      posts,
      cursor: next,
    };
  },
});
