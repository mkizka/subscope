import type { ISubscopeRepository } from "@/app/server/infrastructure/subscope/subscope-repository";

export interface IGetMembersUseCase {
  execute: () => ReturnType<ISubscopeRepository["findMembers"]>;
}

export const getMembersUseCaseFactory = ({
  subscopeRepository,
}: {
  subscopeRepository: ISubscopeRepository;
}): IGetMembersUseCase => ({
  execute: () => subscopeRepository.findMembers(),
});
