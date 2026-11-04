import type { AtIdentifierString } from "@atproto/syntax";

import type { ListDto, ListMemberDto } from "@/app/server/application/dto/list";
import type { IListQuery } from "@/app/server/application/interfaces/list-query";
import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";
import type { TimelinePostDto } from "@/app/server/infrastructure/timeline/timeline-query";

export interface IGetListPageUseCase {
  execute: (
    did: string,
    account: AtIdentifierString,
    rkey: string,
    tab: "posts" | "members",
  ) => Promise<{
    list: ListDto;
    members: ListMemberDto[];
    posts: TimelinePostDto[];
    isSelf: boolean;
  }>;
}

export const getListPageUseCaseFactory = ({
  listQuery,
  backfillQuery,
}: {
  listQuery: IListQuery;
  backfillQuery: IBackfillQuery;
}): IGetListPageUseCase => ({
  async execute(did, account, rkey, tab) {
    const { list, members } = await listQuery.findList(did, account, rkey);
    const [posts, statuses] = await Promise.all([
      tab === "posts" ? listQuery.findPosts(did, list.uri) : [],
      backfillQuery.findTrackedStatuses(members.map((member) => member.did)),
    ]);
    return {
      list,
      members: members.map((member) => ({
        ...member,
        backfillStatus: statuses[member.did],
      })),
      posts,
      isSelf: list.creatorDid === did,
    };
  },
});
