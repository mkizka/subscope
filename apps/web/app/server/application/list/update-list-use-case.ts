import type { IListCommand } from "@/app/server/application/interfaces/list-command";

export interface IUpdateListUseCase {
  execute: IListCommand["update"];
}

export const updateListUseCaseFactory = ({
  listCommand,
}: {
  listCommand: IListCommand;
}): IUpdateListUseCase => ({
  execute: (did, rkey, input) => listCommand.update(did, rkey, input),
});
