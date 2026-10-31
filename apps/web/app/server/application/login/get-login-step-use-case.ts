import type { ISubscopeRepository } from "@/app/server/infrastructure/subscope/subscope-repository";

export interface IGetLoginStepUseCase {
  execute: (
    did: string | null,
  ) => Promise<"setup" | "login" | "inviteCode" | "subscribed">;
}

export const getLoginStepUseCaseFactory = ({
  subscopeRepository,
}: {
  subscopeRepository: ISubscopeRepository;
}): IGetLoginStepUseCase => ({
  async execute(did) {
    if (!did) {
      return (await subscopeRepository.isInitialized()) ? "login" : "setup";
    }
    return (await subscopeRepository.isSubscribed(did))
      ? "subscribed"
      : "inviteCode";
  },
});
