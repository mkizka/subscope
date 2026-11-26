import type { IListCommand } from "@/app/server/application/interfaces/list-command";

export interface IUpdateListUseCase {
  execute: IListCommand["update"];
}

export const updateListUseCaseFactory = ({
  listCommand,
}: {
  listCommand: IListCommand;
}): IUpdateListUseCase => ({
  execute: (did, params) => listCommand.update(did, params),
});
