import type { AtIdentifierString, DidString } from "@atproto/syntax";

import type { ListDto, ListMemberDto } from "@/app/server/application/dto/list";
import type { TimelinePostDto } from "@/app/server/application/dto/timeline-post-dto";

export interface IListQuery {
  findLists: (did: string, account: AtIdentifierString) => Promise<ListDto[]>;
  findList: (
    did: string,
    account: AtIdentifierString,
    rkey: string,
  ) => Promise<{ list: ListDto; members: ListMemberDto[] }>;
  findListsWithMembership: (
    did: string,
    subjectDid: DidString,
  ) => Promise<{ list: ListDto; listItemUri?: string }[]>;
  findPosts: (
    did: string,
    listUri: ListDto["uri"],
  ) => Promise<TimelinePostDto[]>;
}
