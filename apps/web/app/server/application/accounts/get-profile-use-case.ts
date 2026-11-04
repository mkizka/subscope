import type { AtIdentifierString } from "@atproto/syntax";
import type { ProfileViewDetailed } from "@repo/client/lex/app/bsky/actor/defs";

import type { IAccountQuery } from "@/app/server/application/interfaces/account-query";

export interface IGetProfileUseCase {
  execute: (
    did: string,
    account: AtIdentifierString,
  ) => Promise<ProfileViewDetailed>;
}

export const getProfileUseCaseFactory = ({
  accountQuery,
}: {
  accountQuery: IAccountQuery;
}): IGetProfileUseCase => ({
  execute: (did, account) => accountQuery.findProfile(did, account),
});
