import type { MembersDto } from "@/app/server/application/dto/members-dto";
import type { IBackfillQuery } from "@/app/server/application/interfaces/backfill-query";
import type { ISubscopeQuery } from "@/app/server/application/interfaces/subscope-query";

export interface IGetServerMembersUseCase {
  execute: (q?: string) => Promise<MembersDto>;
}

export const getServerMembersUseCaseFactory = ({
  subscopeQuery,
  backfillQuery,
}: {
  subscopeQuery: ISubscopeQuery;
  backfillQuery: IBackfillQuery;
}): IGetServerMembersUseCase => ({
  async execute(q) {
    const result = await subscopeQuery.findMembers(q);
    const statuses = await backfillQuery.findTrackedStatuses(
      result.serverMembers.map((serverMember) => serverMember.did),
    );
    return {
      ...result,
      serverMembers: result.serverMembers.map((serverMember) => ({
        ...serverMember,
        backfillStatus: statuses[serverMember.did],
      })),
    };
  },
});
