import type {
  ISubscopeCommand,
  RegisterResult,
} from "@/app/server/infrastructure/subscope/subscope-command";

export interface IRegisterAccountUseCase {
  execute: (did: string, inviteCode: string) => Promise<RegisterResult>;
}

export const registerAccountUseCaseFactory = ({
  subscopeCommand,
}: {
  subscopeCommand: ISubscopeCommand;
}): IRegisterAccountUseCase => ({
  execute: (did, inviteCode) => subscopeCommand.subscribe(did, inviteCode),
});
