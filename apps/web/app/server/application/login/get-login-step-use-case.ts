import type { ISubscopeQuery } from "@/app/server/application/interfaces/subscope-query";

export interface IGetLoginStepUseCase {
  execute: (
    did: string | null,
  ) => Promise<"setup" | "login" | "inviteCode" | "registered">;
}

export const getLoginStepUseCaseFactory = ({
  subscopeQuery,
}: {
  subscopeQuery: ISubscopeQuery;
}): IGetLoginStepUseCase => ({
  async execute(did) {
    if (!did) {
      return (await subscopeQuery.isInitialized()) ? "login" : "setup";
    }
    return (await subscopeQuery.isRegistered(did))
      ? "registered"
      : "inviteCode";
  },
});
