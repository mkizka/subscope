import type { IListCommand } from "@/app/server/infrastructure/list/list-command";

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
