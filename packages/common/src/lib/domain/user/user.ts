import { type Did, asDid } from "@atproto/did";

export class User {
  readonly did: Did;
  readonly handle: string | null; // handle can fail to resolve

  constructor(params: { did: string; handle?: string | null }) {
    this.did = asDid(params.did);
    this.handle = params.handle ?? null;
  }
}
