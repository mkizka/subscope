import type { AppBskyActorDefs } from "@dawn/client";

import type { ProfileParams } from "./profile.js";
import { Profile } from "./profile.js";

type ProfileDetailedParams = ProfileParams & {
  handle: string;
};

export class ProfileDetailed extends Profile {
  readonly handle: string;

  constructor(params: ProfileDetailedParams) {
    super(params);
    this.handle = params.handle;
  }

  toRecord() {
    return {
      did: this.did,
      handle: this.handle,
      avatar: this.avatarUrl ?? undefined,
    } satisfies AppBskyActorDefs.ProfileViewDetailed;
  }
}
