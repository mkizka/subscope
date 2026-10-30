import { fakeDate, fakeDid } from "../../utils/fake.js";
import { Subscription } from "./subscription.js";
export function subscriptionFactory(params) {
  return new Subscription({
    actorDid: params?.actorDid ?? fakeDid(),
    inviteCode: params?.inviteCode,
    seenAt: params?.seenAt,
    createdAt: params?.createdAt ?? fakeDate(),
  });
}
