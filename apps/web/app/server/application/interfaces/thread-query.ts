import type { AtUriString } from "@atproto/syntax";

import type { TimelinePostDto } from "@/app/server/infrastructure/timeline/timeline-query";

export interface IThreadQuery {
  findThread: (
    did: string,
    uri: AtUriString,
  ) => Promise<{
    ancestors: TimelinePostDto[];
    post: TimelinePostDto;
    replies: TimelinePostDto[][];
  } | null>;
}
