import type { PushPayload } from "../../../domain/push-notification.js";

export type PushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export interface IWebPushSender {
  send: (
    subscription: PushSubscription,
    payload: PushPayload,
  ) => Promise<"sent" | "gone">;
}
