import { fakeDate, fakeDid } from "../../utils/fake.js";
import { Subscription } from "./subscription.js";

export function subscriptionFactory(params?: {
  actorDid?: string;
  inviteCode?: string | null;
  createdAt?: Date;
}): Subscription {
  return new Subscription({
    actorDid: params?.actorDid ?? fakeDid(),
    inviteCode: params?.inviteCode,
    createdAt: params?.createdAt ?? fakeDate(),
  });
}
