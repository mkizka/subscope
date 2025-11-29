import { fakeDate, fakeDid } from "../utils/fake.js";
import { Subscription } from "./subscription.js";

type SubscriptionFactoryParams = {
  actorDid?: string;
  inviteCode?: string | null;
  createdAt?: Date;
};

export function subscriptionFactory(
  params?: SubscriptionFactoryParams,
): Subscription {
  return new Subscription({
    actorDid: params?.actorDid ?? fakeDid(),
    inviteCode:
      params?.inviteCode ??
      `example-com-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: params?.createdAt ?? fakeDate(),
  });
}
