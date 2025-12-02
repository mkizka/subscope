import { fakeDate, fakeDid, fakeHandle } from "../../utils/fake.js";
import { Actor, type ActorParams } from "./actor.js";

export function actorFactory(params?: Partial<ActorParams>): Actor {
  return Actor.reconstruct({
    did: params?.did ?? fakeDid(),
    handle: params?.handle !== undefined ? params.handle : fakeHandle(),
    syncRepoStatus: params?.syncRepoStatus ?? "dirty",
    syncRepoVersion: params?.syncRepoVersion ?? null,
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
