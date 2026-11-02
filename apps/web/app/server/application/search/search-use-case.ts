import type {
  AccountDto,
  IAccountQuery,
} from "@/app/server/infrastructure/account/account-query";
import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";
import type {
  ITimelineQuery,
  TimelinePostDto,
} from "@/app/server/infrastructure/timeline/timeline-query";

export interface ISearchUseCase {
  execute: (
    did: string,
    q: string,
    tab: "accounts" | "posts",
  ) => Promise<{ accounts: AccountDto[]; posts: TimelinePostDto[] }>;
}

export const searchUseCaseFactory = ({
  accountQuery,
  timelineQuery,
  backfillQuery,
}: {
  accountQuery: IAccountQuery;
  backfillQuery: IBackfillQuery;
  timelineQuery: ITimelineQuery;
}): ISearchUseCase => ({
  async execute(did, q, tab) {
    if (tab === "posts") {
      return { accounts: [], posts: await timelineQuery.searchPosts(did, q) };
    }
    const accounts = await accountQuery.searchActors(did, q);
    const statuses = await backfillQuery.findTrackedStatuses(
      accounts.map((account) => account.did),
    );
    return {
      accounts: accounts.map((account) => ({
        ...account,
        backfillStatus: statuses[account.did],
      })),
      posts: [],
    };
  },
});
