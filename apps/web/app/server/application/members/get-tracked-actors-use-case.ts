import type { ISubscopeRepository } from "@/app/server/infrastructure/subscope/subscope-repository";

export interface IGetTrackedActorsUseCase {
  execute: (
    did: string,
  ) => ReturnType<ISubscopeRepository["findTrackedActors"]>;
}

export const getTrackedActorsUseCaseFactory = ({
  subscopeRepository,
}: {
  subscopeRepository: ISubscopeRepository;
}): IGetTrackedActorsUseCase => ({
  execute: (did) => subscopeRepository.findTrackedActors(did),
});
