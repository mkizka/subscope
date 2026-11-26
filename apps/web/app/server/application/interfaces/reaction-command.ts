export type ReactionType = "like" | "repost";

export interface IReactionCommand {
  create: (
    did: string,
    params: { type: ReactionType; subject: { uri: string; cid: string } },
  ) => Promise<string>;
  delete: (
    did: string,
    params: { type: ReactionType; uri: string },
  ) => Promise<void>;
}
