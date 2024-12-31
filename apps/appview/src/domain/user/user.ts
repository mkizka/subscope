import type { Did } from "@atproto/api";
import { asDid } from "@atproto/did";

export class User {
  readonly did: Did;
  readonly handle: string;

  constructor(params: { did: string; handle: string }) {
    this.did = asDid(params.did);
    this.handle = params.handle;
  }
}
