export type FeedItem = {
  uri: string;
  cid: string;
  type: "post" | "repost";
  subjectUri: string | null;
  accountDid: string;
  sortAt: Date;
};
