import type { AppBskyActorDefs } from "@dawn/client/api";

import type { Handle } from "../../utils/handle.js";
import { asHandle } from "../../utils/handle.js";
import type { ProfileParams } from "./profile.js";
import { Profile } from "./profile.js";

export type ProfileDetailedParams = ProfileParams & {
  handle: string | null;
};

export class ProfileDetailed extends Profile {
  readonly handle: Handle | null;

  constructor(params: ProfileDetailedParams) {
    super(params);
    this.handle = params.handle ? asHandle(params.handle) : null;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      handle: this.handle ?? "handle.invalid",
    } satisfies AppBskyActorDefs.ProfileViewDetailed;
  }
}
