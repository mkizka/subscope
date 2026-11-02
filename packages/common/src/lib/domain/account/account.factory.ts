import { fakeDate, fakeDid, fakeHandle } from "../../utils/fake.js";
import { Account, type AccountParams } from "./account.js";

export function accountFactory(params?: Partial<AccountParams>): Account {
  return Account.reconstruct({
    did: params?.did ?? fakeDid(),
    handle: params?.handle !== undefined ? params.handle : fakeHandle(),
    isAdmin: params?.isAdmin ?? false,
    isBanned: params?.isBanned ?? false,
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
