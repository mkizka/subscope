import type { AtIdentifierString } from "@atproto/syntax";

import type { FollowListDto } from "@/app/server/application/dto/account";
import type { IAccountQuery } from "@/app/server/application/interfaces/account-query";
import type { IBackfillQuery } from "@/app/server/application/interfaces/backfill-query";
import type { IFollowQuery } from "@/app/server/application/interfaces/follow-query";

export interface IGetFollowListUseCase {
  execute: (
    did: string,
    account: AtIdentifierString,
    kind: "follows" | "followers",
    filter?: "registered" | "known",
    cursor?: string,
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
  async execute(did, account, kind, filter, cursor) {
    let list =
      kind === "followers" && filter === "known"
        ? await accountQuery.findKnownFollowers(did, account, cursor)
        : await accountQuery.findFollowList(did, account, kind);
    if (kind === "followers" && filter !== "known") {
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
