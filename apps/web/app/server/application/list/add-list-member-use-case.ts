import type { AtIdentifierString, AtUriString } from "@atproto/syntax";

import type { IAccountQuery } from "@/app/server/application/interfaces/account-query";
import type { IListCommand } from "@/app/server/application/interfaces/list-command";

export interface IAddListMemberUseCase {
  execute: (
    did: string,
    params: { listUri: AtUriString; handle: AtIdentifierString },
  ) => Promise<void>;
}

export const addListMemberUseCaseFactory = ({
  accountQuery,
  listCommand,
}: {
  accountQuery: IAccountQuery;
  listCommand: IListCommand;
}): IAddListMemberUseCase => ({
  async execute(did, { listUri, handle }) {
    const profile = await accountQuery.findProfile(did, handle);
    await listCommand.addMember(did, listUri, profile.did);
  },
});
