import type { IReactionRepository } from "@/app/server/infrastructure/reaction/reaction-repository";

export interface IToggleReactionUseCase {
  execute: (
    did: string,
    params: {
      type: "like" | "repost";
      uri: string;
      cid: string;
      recordUri?: string;
    },
  ) => Promise<{ uri: string | null }>;
}

export const toggleReactionUseCaseFactory = ({
  reactionRepository,
}: {
  reactionRepository: IReactionRepository;
}): IToggleReactionUseCase => ({
  async execute(did, { type, uri, cid, recordUri }) {
    if (recordUri) {
      await reactionRepository.delete(did, type, recordUri);
      return { uri: null };
    }
    return { uri: await reactionRepository.create(did, type, { uri, cid }) };
  },
});
