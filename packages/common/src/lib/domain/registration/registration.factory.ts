import { fakeDate, fakeDid } from "../../utils/fake.js";
import { Registration } from "./registration.js";

export function registrationFactory(params?: {
  actorDid?: string;
  inviteCode?: string | null;
  seenAt?: Date | null;
  createdAt?: Date;
}): Registration {
  return new Registration({
    actorDid: params?.actorDid ?? fakeDid(),
    inviteCode: params?.inviteCode,
    seenAt: params?.seenAt,
    createdAt: params?.createdAt ?? fakeDate(),
  });
}
