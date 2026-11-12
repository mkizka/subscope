export type PushSubscriptionDto = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export interface IPushSubscriptionCommand {
  upsert: (did: string, subscription: PushSubscriptionDto) => Promise<void>;
  delete: (did: string, endpoint: string) => Promise<void>;
}
