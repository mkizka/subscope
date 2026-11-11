import type {
  IWebPushSender,
  PushPayload,
  PushSubscription,
} from "../../application/interfaces/external/web-push-sender.js";

export class InMemoryWebPushSender implements IWebPushSender {
  private sent: { endpoint: string; payload: PushPayload }[] = [];
  private goneEndpoints = new Set<string>();

  async send(subscription: PushSubscription, payload: PushPayload) {
    if (this.goneEndpoints.has(subscription.endpoint)) return "gone";
    this.sent.push({ endpoint: subscription.endpoint, payload });
    return "sent";
  }

  markGone(endpoint: string): void {
    this.goneEndpoints.add(endpoint);
  }

  getSent() {
    return this.sent;
  }

  clear(): void {
    this.sent = [];
    this.goneEndpoints.clear();
  }
}
