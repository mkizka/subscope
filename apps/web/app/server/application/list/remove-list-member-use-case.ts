import type { IListCommand } from "@/app/server/infrastructure/list/list-command";

export interface IRemoveListMemberUseCase {
  execute: IListCommand["removeMember"];
}

export const removeListMemberUseCaseFactory = ({
  listCommand,
}: {
  listCommand: IListCommand;
}): IRemoveListMemberUseCase => ({
  execute: (did, listItemUri) => listCommand.removeMember(did, listItemUri),
});
