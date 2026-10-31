import type { AtIdentifierString } from "@atproto/syntax";

import type {
  IListQuery,
  ListDto,
  ListMemberDto,
} from "@/app/server/infrastructure/list/list-query";
import type { TimelinePostDto } from "@/app/server/infrastructure/timeline/timeline-query";

export interface IGetListPageUseCase {
  execute: (
    did: string,
    actor: AtIdentifierString,
    rkey: string,
    tab: "posts" | "members",
  ) => Promise<{
    list: ListDto;
    members: ListMemberDto[];
    posts: TimelinePostDto[];
  }>;
}

export const getListPageUseCaseFactory = ({
  listQuery,
}: {
  listQuery: IListQuery;
}): IGetListPageUseCase => ({
  async execute(did, actor, rkey, tab) {
    const { list, members } = await listQuery.findList(did, actor, rkey);
    const posts =
      tab === "posts" ? await listQuery.findPosts(did, list.uri) : [];
    return { list, members, posts };
  },
});
