import type { TimelinePostDto } from "@/app/server/application/dto/timeline-post-dto";

export interface ITimelineQuery {
  isRegistered: (did: string) => Promise<boolean>;
  findPosts: (
    did: string,
    cursor?: string,
  ) => Promise<{ posts: TimelinePostDto[]; cursor?: string }>;
  findLocalPosts: (
    did: string,
    cursor?: string,
  ) => Promise<{ posts: TimelinePostDto[]; cursor?: string }>;
  searchPosts: (did: string, q: string) => Promise<TimelinePostDto[]>;
}
