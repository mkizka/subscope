import type {
  ActorDto,
  IActorQuery,
} from "@/app/server/infrastructure/actor/actor-query";
import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";
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
  backfillQuery,
}: {
  actorQuery: IActorQuery;
  backfillQuery: IBackfillQuery;
  timelineQuery: ITimelineQuery;
}): ISearchUseCase => ({
  async execute(did, q, tab) {
    if (tab === "posts") {
      return { actors: [], posts: await timelineQuery.searchPosts(did, q) };
    }
    const actors = await actorQuery.searchActors(did, q);
    const statuses = await backfillQuery.findTrackedStatuses(
      actors.map((actor) => actor.did),
    );
    return {
      actors: actors.map((actor) => ({
        ...actor,
        backfillStatus: statuses[actor.did],
      })),
      posts: [],
    };
  },
});
