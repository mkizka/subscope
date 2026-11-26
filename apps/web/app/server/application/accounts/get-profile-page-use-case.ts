import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/app/bsky/actor/defs";

import type { BackfillStatus } from "@/app/lib/backfill-status";
import type { ProfileTab } from "@/app/server/application/dto/account";
import type { TimelinePostDto } from "@/app/server/application/dto/timeline-post-dto";
import type { IAccountQuery } from "@/app/server/application/interfaces/account-query";
import type { IBackfillQuery } from "@/app/server/application/interfaces/backfill-query";

export interface IGetProfilePageUseCase {
  execute: (
    did: string,
    params: { account: AtIdentifierString; tab: ProfileTab; cursor?: string },
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
}: {
  accountQuery: IAccountQuery;
  backfillQuery: IBackfillQuery;
}): IGetProfilePageUseCase => ({
  async execute(did, { account, tab, cursor }) {
    const [profile, { posts, cursor: next }] = await Promise.all([
      accountQuery.findProfile(did, account),
      accountQuery.findPosts(did, { account, tab, cursor }),
    ]);
    const statuses = await backfillQuery.findTrackedStatuses([profile.did]);
    const tracked = statuses[profile.did];
    return {
      profile,
      isSelf: profile.did === did,
      isMember: !!tracked?.isMember,
      backfillStatus: tracked?.status,
      posts,
      cursor: next,
    };
  },
});
