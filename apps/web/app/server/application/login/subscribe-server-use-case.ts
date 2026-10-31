import type {
  ISubscopeCommand,
  SubscribeResult,
} from "@/app/server/infrastructure/subscope/subscope-command";

export interface ISubscribeServerUseCase {
  execute: (did: string, inviteCode: string) => Promise<SubscribeResult>;
}

export const subscribeServerUseCaseFactory = ({
  subscopeCommand,
}: {
  subscopeCommand: ISubscopeCommand;
}): ISubscribeServerUseCase => ({
  execute: (did, inviteCode) => subscopeCommand.subscribe(did, inviteCode),
});
