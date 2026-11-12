export type PushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  tag: string;
};

export interface IWebPushSender {
  send: (
    subscription: PushSubscription,
    payload: PushPayload,
  ) => Promise<"sent" | "gone">;
}
