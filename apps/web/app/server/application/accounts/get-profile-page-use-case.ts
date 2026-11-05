import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/app/bsky/actor/defs";
import type { BackfillStatus } from "@repo/common/domain";

import type {
  IAccountQuery,
  ProfileTab,
} from "@/app/server/infrastructure/account/account-query";
import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";
import type { TimelinePostDto } from "@/app/server/infrastructure/timeline/timeline-query";

export interface IGetProfilePageUseCase {
  execute: (
    did: string,
    account: AtIdentifierString,
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
  accountQuery,
  backfillQuery,
}: {
  accountQuery: IAccountQuery;
  backfillQuery: IBackfillQuery;
}): IGetProfilePageUseCase => ({
  async execute(did, account, tab) {
    const [profile, posts] = await Promise.all([
      accountQuery.findProfile(did, account),
      accountQuery.findPosts(did, account, tab),
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
