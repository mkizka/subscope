import { fakeHandle } from "../../utils/fake.js";
import { profileFactory } from "./profile.factory.js";
import type { ProfileDetailedParams } from "./profile-detailed.js";
import { ProfileDetailed } from "./profile-detailed.js";

export function profileDetailedFactory(
  params?: Partial<ProfileDetailedParams>,
): ProfileDetailed {
  const baseProfile = profileFactory(params);

  return new ProfileDetailed({
    uri: baseProfile.uri,
    cid: baseProfile.cid,
    actorDid: baseProfile.actorDid,
    avatarCid: baseProfile.avatarCid,
    bannerCid: baseProfile.bannerCid,
    description: baseProfile.description,
    displayName: baseProfile.displayName,
    createdAt: baseProfile.createdAt,
    indexedAt: baseProfile.indexedAt,
    handle: params?.handle ?? fakeHandle(),
  });
}
