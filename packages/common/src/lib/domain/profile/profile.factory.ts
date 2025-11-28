import { fakeAtUri, fakeCid, fakeDate, fakeDid } from "../../utils/fake.js";
import { Profile, type ProfileParams } from "./profile.js";

export function profileFactory(params?: Partial<ProfileParams>): Profile {
  const defaultDid = fakeDid();

  return new Profile({
    uri:
      params?.uri ??
      fakeAtUri({ did: defaultDid, collection: "app.bsky.actor.profile" }),
    cid: params?.cid ?? fakeCid(),
    actorDid: params?.actorDid ?? defaultDid,
    avatarCid: params?.avatarCid ?? null,
    bannerCid: params?.bannerCid ?? null,
    description: params?.description ?? null,
    displayName: params?.displayName ?? null,
    createdAt: params?.createdAt ?? null,
    indexedAt: params?.indexedAt ?? fakeDate(),
  });
}
