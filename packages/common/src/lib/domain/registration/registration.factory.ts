import { fakeDate, fakeDid } from "../../utils/fake.js";
import { Registration } from "./registration.js";

export function registrationFactory(params?: {
  accountDid?: string;
  inviteCode?: string | null;
  seenAt?: Date | null;
  createdAt?: Date;
}): Registration {
  return new Registration({
    accountDid: params?.accountDid ?? fakeDid(),
    inviteCode: params?.inviteCode,
    seenAt: params?.seenAt,
    createdAt: params?.createdAt ?? fakeDate(),
  });
}
