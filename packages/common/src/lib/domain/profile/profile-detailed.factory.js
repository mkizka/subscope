import { fakeHandle } from "../../utils/fake.js";
import { profileFactory } from "./profile.factory.js";
import { ProfileDetailed } from "./profile-detailed.js";
export function profileDetailedFactory(params) {
  const baseProfile = profileFactory(params);
  return new ProfileDetailed({
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
