import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";
import type {
  ISubscopeQuery,
  MembersDto,
} from "@/app/server/infrastructure/subscope/subscope-query";

export interface IGetMembersUseCase {
  execute: () => Promise<MembersDto>;
}

export const getMembersUseCaseFactory = ({
  subscopeQuery,
  backfillQuery,
}: {
  subscopeQuery: ISubscopeQuery;
  backfillQuery: IBackfillQuery;
}): IGetMembersUseCase => ({
  async execute() {
    const result = await subscopeQuery.findMembers();
    const statuses = await backfillQuery.findTrackedStatuses(
      result.members.map((member) => member.did),
    );
    return {
      ...result,
      members: result.members.map((member) => ({
        ...member,
        backfillStatus: statuses[member.did],
      })),
    };
  },
});
