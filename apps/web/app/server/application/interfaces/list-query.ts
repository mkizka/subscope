import type { AtIdentifierString } from "@atproto/syntax";

import type { ListDto, ListMemberDto } from "@/app/server/application/dto/list";
import type { TimelinePostDto } from "@/app/server/infrastructure/timeline/timeline-query";

export interface IListQuery {
  findLists: (did: string, account: AtIdentifierString) => Promise<ListDto[]>;
  findList: (
    did: string,
    account: AtIdentifierString,
    rkey: string,
  ) => Promise<{ list: ListDto; members: ListMemberDto[] }>;
  findPosts: (
    did: string,
    listUri: ListDto["uri"],
  ) => Promise<TimelinePostDto[]>;
}
