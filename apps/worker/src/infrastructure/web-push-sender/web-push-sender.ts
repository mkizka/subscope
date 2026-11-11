import webpush from "web-push";

import type {
  IWebPushSender,
  PushPayload,
  PushSubscription,
} from "../../application/interfaces/external/web-push-sender.js";

const TTL_SECONDS = 24 * 60 * 60;

export class WebPushSender implements IWebPushSender {
  constructor(
    private readonly vapidPublicKey: string | undefined,
    private readonly vapidPrivateKey: string | undefined,
    private readonly vapidSubject: string | undefined,
  ) {}

  async send(subscription: PushSubscription, payload: PushPayload) {
    if (!this.vapidPublicKey || !this.vapidPrivateKey || !this.vapidSubject) {
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
          subject: this.vapidSubject,
          publicKey: this.vapidPublicKey,
          privateKey: this.vapidPrivateKey,
        },
      },
    );
    const response = await fetch(request.endpoint, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    if (response.status === 404 || response.status === 410) return "gone";
    if (!response.ok) {
      throw new Error(`Push server responded with ${response.status}`);
    }
    return "sent";
  }
}
