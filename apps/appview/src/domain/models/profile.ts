import { asDid, type Did } from "@atproto/did";

export type ProfileParams = {
  did: string;
  avatar?: string | null;
  description?: string | null;
  displayName?: string | null;
};

export class Profile {
  readonly did: Did;
  readonly avatar: string | null;
  readonly description: string | null;
  readonly displayName: string | null;

  constructor(params: ProfileParams) {
    this.did = asDid(params.did);
    this.avatar = params.avatar ?? null;
    this.description = params.description ?? null;
    this.displayName = params.displayName ?? null;
  }
}
