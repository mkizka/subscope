import { Profile, ProfileParams } from "./profile.js";

export type ProfileDetailedParams = ProfileParams & {
  handle: string;
};

export class ProfileDetailed extends Profile {
  readonly handle: string;

  constructor(params: ProfileDetailedParams) {
    super(params);
    this.handle = params.handle;
  }
}
