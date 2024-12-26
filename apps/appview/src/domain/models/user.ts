import type { Did } from "@atproto/api";

export class User {
  did: Did;
  handle: string | null;

  constructor(options: { did: Did; handle?: string }) {
    this.did = options.did;
    this.handle = options.handle ?? null;
  }
}
