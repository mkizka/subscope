import type { IListCommand } from "@/app/server/application/interfaces/list-command";

export interface ICreateListUseCase {
  execute: IListCommand["create"];
}

export const createListUseCaseFactory = ({
  listCommand,
}: {
  listCommand: IListCommand;
}): ICreateListUseCase => ({
  execute: (did, input) => listCommand.create(did, input),
});
