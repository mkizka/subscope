import type {
  ActorDto,
  IActorQuery,
} from "@/app/server/infrastructure/actor/actor-query";

export interface ISearchActorsUseCase {
  execute: (did: string, q: string) => Promise<ActorDto[]>;
}

export const searchActorsUseCaseFactory = ({
  actorQuery,
}: {
  actorQuery: IActorQuery;
}): ISearchActorsUseCase => ({
  execute: (did, q) => actorQuery.searchActors(did, q),
});
