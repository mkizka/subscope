import type { IFollowRepository } from "@/app/server/infrastructure/follow/follow-repository";

export interface IToggleFollowUseCase {
  execute: (
    did: string,
    params: { did: `did:${string}:${string}`; followUri?: string },
  ) => Promise<{ uri: string | null }>;
}

export const toggleFollowUseCaseFactory = ({
  followRepository,
}: {
  followRepository: IFollowRepository;
}): IToggleFollowUseCase => ({
  async execute(did, params) {
    if (params.followUri) {
      await followRepository.delete(did, params.followUri);
      return { uri: null };
    }
    return { uri: await followRepository.create(did, params.did) };
  },
});
