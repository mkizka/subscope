import { asDid, type Did } from "@atproto/did";

import type { Handle } from "../../utils/handle.js";
import { asHandle } from "../../utils/handle.js";

export class Actor {
  readonly did: Did;
  readonly handle: Handle | null; // handle can fail to resolve

  constructor(params: { did: string; handle?: string | null }) {
    this.did = asDid(params.did);
    this.handle = params.handle ? asHandle(params.handle) : null;
  }
}
