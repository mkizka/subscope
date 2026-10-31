import type { IListCommand } from "@/app/server/infrastructure/list/list-command";

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
