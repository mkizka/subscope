import type { AtUriString } from "@atproto/syntax";

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
  findQuotes: (
    did: string,
    uri: AtUriString,
    cursor?: string,
  ) => Promise<{ posts: TimelinePostDto[]; cursor?: string }>;
}
