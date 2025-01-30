import type { AppBskyActorDefs } from "@dawn/client";

import type { ProfileParams } from "./profile.js";
import { Profile } from "./profile.js";

export type ProfileDetailedParams = ProfileParams & {
  handle: string | null;
};

export class ProfileDetailed extends Profile {
  readonly handle: string | null;

  constructor(params: ProfileDetailedParams) {
    super(params);
    this.handle = params.handle;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      handle: this.handle ?? "handle.invalid",
    } satisfies AppBskyActorDefs.ProfileViewDetailed;
  }
}
