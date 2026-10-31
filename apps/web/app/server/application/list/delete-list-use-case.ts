import type { IListCommand } from "@/app/server/infrastructure/list/list-command";

export interface IDeleteListUseCase {
  execute: IListCommand["delete"];
}

export const deleteListUseCaseFactory = ({
  listCommand,
}: {
  listCommand: IListCommand;
}): IDeleteListUseCase => ({
  execute: (did, rkey) => listCommand.delete(did, rkey),
});
