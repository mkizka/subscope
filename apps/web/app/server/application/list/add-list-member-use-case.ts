import type { AtIdentifierString, AtUriString } from "@atproto/syntax";

import type { IActorQuery } from "@/app/server/infrastructure/actor/actor-query";
import type { IListCommand } from "@/app/server/infrastructure/list/list-command";

export interface IAddListMemberUseCase {
  execute: (
    did: string,
    params: { listUri: AtUriString; handle: AtIdentifierString },
  ) => Promise<void>;
}

export const addListMemberUseCaseFactory = ({
  actorQuery,
  listCommand,
}: {
  actorQuery: IActorQuery;
  listCommand: IListCommand;
}): IAddListMemberUseCase => ({
  async execute(did, { listUri, handle }) {
    const profile = await actorQuery.findProfile(did, handle);
    await listCommand.addMember(did, listUri, profile.did);
  },
});
