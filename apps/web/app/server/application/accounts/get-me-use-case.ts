import type { DidString } from "@atproto/syntax";

import type { IAccountQuery } from "@/app/server/infrastructure/account/account-query";

export interface IGetMeUseCase {
  execute: (did: DidString) => Promise<{
    did: string;
    avatarUrl?: string;
    displayName?: string;
    handle?: string;
    isAdmin: boolean;
  }>;
}

export const getMeUseCaseFactory = ({
  accountQuery,
}: {
  accountQuery: IAccountQuery;
}): IGetMeUseCase => ({
  async execute(did) {
    const [profile, isAdmin] = await Promise.all([
      accountQuery.findProfile(did, did).catch(() => undefined),
      accountQuery.isAdmin(did),
    ]);
    return {
      did,
      avatarUrl: profile?.avatar,
      displayName: profile?.displayName,
      handle: profile?.handle,
      isAdmin,
    };
  },
});
