import { fakeDate, fakeDid } from "../../utils/fake.js";
import { Subscription } from "./subscription.js";

export function subscriptionFactory(params?: {
  actorDid?: string;
  inviteCode?: string | null;
  seenAt?: Date | null;
  createdAt?: Date;
}): Subscription {
  return new Subscription({
    actorDid: params?.actorDid ?? fakeDid(),
    inviteCode: params?.inviteCode,
    seenAt: params?.seenAt,
    createdAt: params?.createdAt ?? fakeDate(),
  });
}
