import type { IFollowCommand } from "@/app/server/infrastructure/follow/follow-command";

export interface IToggleFollowUseCase {
  execute: (
    did: string,
    params: { did: `did:${string}:${string}`; followUri?: string },
  ) => Promise<{ uri: string | null }>;
}

export const toggleFollowUseCaseFactory = ({
  followCommand,
}: {
  followCommand: IFollowCommand;
}): IToggleFollowUseCase => ({
  async execute(did, params) {
    if (params.followUri) {
      await followCommand.delete(did, params.followUri);
      return { uri: null };
    }
    return { uri: await followCommand.create(did, params.did) };
  },
});
