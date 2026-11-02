import type { AtIdentifierString } from "@atproto/syntax";

import type {
  FollowListDto,
  IAccountQuery,
} from "@/app/server/infrastructure/account/account-query";
import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";

export interface IGetFollowListUseCase {
  execute: (
    did: string,
    account: AtIdentifierString,
    kind: "follows" | "followers",
  ) => Promise<FollowListDto>;
}

export const getFollowListUseCaseFactory = ({
  accountQuery,
  backfillQuery,
}: {
  accountQuery: IAccountQuery;
  backfillQuery: IBackfillQuery;
}): IGetFollowListUseCase => ({
  async execute(did, account, kind) {
    const list = await accountQuery.findFollowList(did, account, kind);
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
