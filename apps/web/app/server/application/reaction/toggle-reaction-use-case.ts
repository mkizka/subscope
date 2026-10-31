import type { IReactionCommand } from "@/app/server/infrastructure/reaction/reaction-command";

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
  reactionCommand,
}: {
  reactionCommand: IReactionCommand;
}): IToggleReactionUseCase => ({
  async execute(did, { type, uri, cid, recordUri }) {
    if (recordUri) {
      await reactionCommand.delete(did, type, recordUri);
      return { uri: null };
    }
    return { uri: await reactionCommand.create(did, type, { uri, cid }) };
  },
});
