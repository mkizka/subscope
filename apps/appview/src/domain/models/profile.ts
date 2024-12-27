import type { Did } from "@atproto/api";

export class Profile {
  did: Did;
  avatar: string | null;
  description: string | null;
  displayName: string | null;

  constructor(options: {
    did: Did;
    avatar?: string;
    description?: string;
    displayName?: string;
  }) {
    this.did = options.did;
    this.avatar = options.avatar ?? null;
    this.description = options.description ?? null;
    this.displayName = options.displayName ?? null;
  }
}
