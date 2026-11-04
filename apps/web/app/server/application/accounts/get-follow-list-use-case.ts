import type { AtIdentifierString } from "@atproto/syntax";

import type { FollowListDto } from "@/app/server/application/dto/account";
import type { IAccountQuery } from "@/app/server/application/interfaces/account-query";
import type { IFollowQuery } from "@/app/server/application/interfaces/follow-query";
import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";

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
