import type { AtUriString } from "@atproto/syntax";

import type { AccountDto } from "@/app/server/application/dto/account";
import type { TimelinePostDto } from "@/app/server/application/dto/timeline-post-dto";

export interface IThreadQuery {
  findThread: (
    did: string,
    uri: AtUriString,
  ) => Promise<{
    ancestors: TimelinePostDto[];
    post: TimelinePostDto;
    replies: TimelinePostDto[][];
  } | null>;
  findReactors: (
    did: string,
    uri: AtUriString,
    kind: "liked-by" | "reposted-by",
    cursor?: string,
  ) => Promise<{ accounts: AccountDto[]; cursor?: string }>;
  findQuotes: (
    did: string,
    uri: AtUriString,
    cursor?: string,
  ) => Promise<{ posts: TimelinePostDto[]; cursor?: string }>;
}
