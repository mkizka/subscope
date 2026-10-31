import type {
  ISubscopeQuery,
  MembersDto,
} from "@/app/server/infrastructure/subscope/subscope-query";

export interface IGetMembersUseCase {
  execute: () => Promise<MembersDto>;
}

export const getMembersUseCaseFactory = ({
  subscopeQuery,
}: {
  subscopeQuery: ISubscopeQuery;
}): IGetMembersUseCase => ({
  execute: () => subscopeQuery.findMembers(),
});
