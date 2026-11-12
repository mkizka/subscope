import webpush from "web-push";

import type {
  IWebPushSender,
  PushPayload,
  PushSubscription,
} from "../../application/interfaces/external/web-push-sender.js";
import type { Env } from "../../shared/env.js";

const TTL_SECONDS = 24 * 60 * 60;

export class WebPushSender implements IWebPushSender {
  constructor(
    private readonly env: Pick<
      Env,
      "VAPID_PUBLIC_KEY" | "VAPID_PRIVATE_KEY" | "VAPID_SUBJECT"
    >,
  ) {}

  async send(subscription: PushSubscription, payload: PushPayload) {
    const {
      VAPID_PUBLIC_KEY: publicKey,
      VAPID_PRIVATE_KEY: privateKey,
      VAPID_SUBJECT: subject,
    } = this.env;
    if (!publicKey || !privateKey || !subject) {
      throw new Error("VAPID keys are not configured");
    }
    // web-pushの送信関数はhttpsにしか送れないので、暗号化したリクエストだけ作ってfetchで送る
    const request = webpush.generateRequestDetails(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      {
        TTL: TTL_SECONDS,
        vapidDetails: {
          subject,
          publicKey,
          privateKey,
        },
      },
    );
    const response = await fetch(request.endpoint, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 404 || response.status === 410) return "gone";
    if (!response.ok) {
      throw new Error(`Push server responded with ${response.status}`);
    }
    return "sent";
  }
}
