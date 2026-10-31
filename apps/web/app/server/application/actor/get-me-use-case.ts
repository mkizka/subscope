import type { DidString } from "@atproto/syntax";

import type { IActorQuery } from "@/app/server/infrastructure/actor/actor-query";

export interface IGetMeUseCase {
  execute: (did: DidString) => Promise<{
    did: string;
    avatarUrl?: string;
    handle?: string;
    isAdmin: boolean;
  }>;
}

export const getMeUseCaseFactory = ({
  actorQuery,
}: {
  actorQuery: IActorQuery;
}): IGetMeUseCase => ({
  async execute(did) {
    const [profile, isAdmin] = await Promise.all([
      actorQuery.findProfile(did, did).catch(() => undefined),
      actorQuery.isAdmin(did),
    ]);
    return {
      did,
      avatarUrl: profile?.avatar,
      handle: profile?.handle,
      isAdmin,
    };
  },
});
