import type {
  ActorDto,
  IActorQuery,
} from "@/app/server/infrastructure/actor/actor-query";
import type {
  ITimelineQuery,
  TimelinePostDto,
} from "@/app/server/infrastructure/timeline/timeline-query";

export interface ISearchUseCase {
  execute: (
    did: string,
    q: string,
    tab: "actors" | "posts",
  ) => Promise<{ actors: ActorDto[]; posts: TimelinePostDto[] }>;
}

export const searchUseCaseFactory = ({
  actorQuery,
  timelineQuery,
}: {
  actorQuery: IActorQuery;
  timelineQuery: ITimelineQuery;
}): ISearchUseCase => ({
  async execute(did, q, tab) {
    return tab === "posts"
      ? { actors: [], posts: await timelineQuery.searchPosts(did, q) }
      : { actors: await actorQuery.searchActors(did, q), posts: [] };
  },
});
