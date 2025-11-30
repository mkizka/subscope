import { faker } from "@faker-js/faker";

import { fakeDate } from "../utils/fake.js";
import { InviteCode } from "./invite-code.js";

export function inviteCodeFactory(params?: {
  code?: string;
  expiresAt?: Date;
  createdAt?: Date;
  usedAt?: Date | null;
}): InviteCode {
  const createdAt = params?.createdAt ?? fakeDate();
  const expiresAt =
    params?.expiresAt ??
    new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  return new InviteCode({
    code:
      params?.code ??
      `test-${faker.string.alphanumeric({ length: 5, casing: "lower" })}`,
    expiresAt,
    createdAt,
    usedAt: params?.usedAt,
  });
}
