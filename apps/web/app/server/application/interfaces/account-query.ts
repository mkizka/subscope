import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/app/bsky/actor/defs";

import type {
  AccountDto,
  FollowListDto,
  ProfileTab,
} from "@/app/server/application/dto/account";
import type { TimelinePostDto } from "@/app/server/application/dto/timeline-post-dto";

export interface IAccountQuery {
  findProfile: (
    did: string,
    account: AtIdentifierString,
  ) => Promise<ProfileViewDetailed>;
  findPosts: (
    did: string,
    account: AtIdentifierString,
    tab: ProfileTab,
  ) => Promise<TimelinePostDto[]>;
  findFollowList: (
    did: string,
    account: AtIdentifierString,
    kind: "follows" | "followers",
  ) => Promise<FollowListDto>;
  findProfiles: (did: string, dids: string[]) => Promise<AccountDto[]>;
  isAdmin: (did: string) => Promise<boolean>;
  searchActors: (did: string, q: string) => Promise<AccountDto[]>;
}
