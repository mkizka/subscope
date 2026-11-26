export type Notification = {
  recordUri: string;
  recipientDid: string;
  authorDid: string;
  reason: "like" | "repost" | "follow" | "mention" | "reply" | "quote";
  reasonSubject: string | null;
  sortAt: Date;
};
