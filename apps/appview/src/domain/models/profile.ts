import { asDid, type Did } from "@atproto/did";

export class Profile {
  did: Did;
  handle: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;

  constructor(options: {
    did: string;
    handle: string;
    avatar?: string | null;
    description?: string | null;
    displayName?: string | null;
  }) {
    this.did = asDid(options.did);
    this.handle = options.handle;
    this.avatar = options.avatar ?? null;
    this.description = options.description ?? null;
    this.displayName = options.displayName ?? null;
  }
}
