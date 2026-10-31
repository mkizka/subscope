import type {
  ISubscopeRepository,
  SubscribeResult,
} from "@/app/server/infrastructure/subscope/subscope-repository";

export interface ISubscribeServerUseCase {
  execute: (did: string, inviteCode: string) => Promise<SubscribeResult>;
}

export const subscribeServerUseCaseFactory = ({
  subscopeRepository,
}: {
  subscopeRepository: ISubscopeRepository;
}): ISubscribeServerUseCase => ({
  execute: (did, inviteCode) => subscopeRepository.subscribe(did, inviteCode),
});
