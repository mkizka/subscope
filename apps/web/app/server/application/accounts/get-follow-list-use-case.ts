import type { AtIdentifierString } from "@atproto/syntax";

import type {
  FollowListDto,
  IAccountQuery,
} from "@/app/server/infrastructure/account/account-query";
import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";
import type { IFollowQuery } from "@/app/server/infrastructure/follow/follow-query";

export interface IGetFollowListUseCase {
  execute: (
    did: string,
    account: AtIdentifierString,
    kind: "follows" | "followers",
    filter?: "registered",
  ) => Promise<FollowListDto>;
}

export const getFollowListUseCaseFactory = ({
  accountQuery,
  backfillQuery,
  followQuery,
}: {
  accountQuery: IAccountQuery;
  backfillQuery: IBackfillQuery;
  followQuery: IFollowQuery;
}): IGetFollowListUseCase => ({
  async execute(did, account, kind, filter) {
    let list = await accountQuery.findFollowList(did, account, kind);
    if (kind === "followers") {
      const { total, dids } = await followQuery.findRegisteredFollowers(
        account,
        filter === "registered" ? 100 : 1,
      );
      list = {
        ...list,
        registeredCount: total,
        ...(filter === "registered" && {
          accounts: await accountQuery.findProfiles(did, dids),
        }),
      };
    }
    const statuses = await backfillQuery.findTrackedStatuses(
      list.accounts.map((item) => item.did),
    );
    return {
      ...list,
      accounts: list.accounts.map((item) => ({
        ...item,
        backfillStatus: statuses[item.did],
      })),
    };
  },
});
