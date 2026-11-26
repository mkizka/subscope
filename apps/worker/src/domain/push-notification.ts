export type PushPayload = {
  title: string;
  body: string;
  tag: string;
};

type Reason = "like" | "repost" | "follow" | "mention" | "reply" | "quote";

const TITLES = {
  like: "さんがいいねしました",
  repost: "さんがリポストしました",
  follow: "さんにフォローされました",
  reply: "さんが返信しました",
  quote: "さんが引用しました",
  mention: "さんがメンションしました",
} satisfies Record<Reason, string>;

export class PushNotification {
  readonly recordUri: string;
  readonly reason: Reason;
  readonly reasonSubject: string | null;
  readonly authorName: string;
  readonly postText: string | null;

  constructor(params: {
    recordUri: string;
    reason: Reason;
    reasonSubject: string | null;
    authorName: string;
    postText: string | null;
  }) {
    this.recordUri = params.recordUri;
    this.reason = params.reason;
    this.reasonSubject = params.reasonSubject;
    this.authorName = params.authorName;
    this.postText = params.postText;
  }

  get payload(): PushPayload {
    const isLikeOrRepost = this.reason === "like" || this.reason === "repost";
    return {
      title: `${this.authorName}${TITLES[this.reason]}`,
      body: this.postText ?? "",
      // 同じタグの通知は端末上で置き換わるので、同じ投稿へのいいね・リポストは1件にまとまる
      tag: isLikeOrRepost
        ? `${this.reason}:${this.reasonSubject}`
        : this.recordUri,
    };
  }
}
