import { fakeDate, fakeDid, fakeHandle } from "@repo/common/test";

import { Account, type AccountParams } from "./account.js";

export function accountFactory(params?: Partial<AccountParams>): Account {
  return Account.reconstruct({
    did: params?.did ?? fakeDid(),
    handle: params?.handle !== undefined ? params.handle : fakeHandle(),
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
