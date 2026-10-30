import { fakeDate, fakeDid, fakeHandle } from "../../utils/fake.js";
import { Actor } from "./actor.js";
export function actorFactory(params) {
  return Actor.reconstruct({
    did: params?.did ?? fakeDid(),
    handle: params?.handle !== undefined ? params.handle : fakeHandle(),
    isAdmin: params?.isAdmin ?? false,
    isBanned: params?.isBanned ?? false,
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
