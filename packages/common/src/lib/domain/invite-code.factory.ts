import { fakeDate, fakeFutureDate } from "../utils/fake.js";
import { InviteCode } from "./invite-code.js";

type InviteCodeFactoryParams = {
  code?: string;
  expiresAt?: Date;
  createdAt?: Date;
  usedAt?: Date | null;
};

export function inviteCodeFactory(
  params?: InviteCodeFactoryParams,
): InviteCode {
  return new InviteCode({
    code:
      params?.code ??
      `example-com-${Math.random().toString(36).substring(2, 7)}`,
    expiresAt: params?.expiresAt ?? fakeFutureDate(),
    createdAt: params?.createdAt ?? fakeDate(),
    usedAt: params?.usedAt ?? null,
  });
}
