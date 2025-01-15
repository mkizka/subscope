import { type Did, asDid } from "@atproto/did";
import { asHandle, Handle } from "../../utils/handle.js";

export class User {
  readonly did: Did;
  readonly handle: Handle | null; // handle can fail to resolve

  constructor(params: { did: string; handle?: string | null }) {
    this.did = asDid(params.did);
    this.handle = params.handle ? asHandle(params.handle) : null;
  }
}
