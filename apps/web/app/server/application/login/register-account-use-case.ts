import type { RegisterResult } from "@/app/server/application/dto/register-result";
import type { ISubscopeCommand } from "@/app/server/application/interfaces/subscope-command";

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
