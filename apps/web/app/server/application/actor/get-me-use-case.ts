import type { DidString } from "@atproto/syntax";

import type { IActorRepository } from "@/app/server/infrastructure/actor/actor-repository";

export interface IGetMeUseCase {
  execute: (did: DidString) => Promise<{
    did: string;
    avatarUrl?: string;
    handle?: string;
    isAdmin: boolean;
  }>;
}

export const getMeUseCaseFactory = ({
  actorRepository,
}: {
  actorRepository: IActorRepository;
}): IGetMeUseCase => ({
  async execute(did) {
    const [profile, isAdmin] = await Promise.all([
      actorRepository.findProfile(did, did).catch(() => undefined),
      actorRepository.isAdmin(did),
    ]);
    return {
      did,
      avatarUrl: profile?.avatar,
      handle: profile?.handle,
      isAdmin,
    };
  },
});
