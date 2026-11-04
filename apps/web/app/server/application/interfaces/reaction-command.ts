export type ReactionType = "like" | "repost";

export interface IReactionCommand {
  create: (
    did: string,
    type: ReactionType,
    subject: { uri: string; cid: string },
  ) => Promise<string>;
  delete: (did: string, type: ReactionType, uri: string) => Promise<void>;
}
