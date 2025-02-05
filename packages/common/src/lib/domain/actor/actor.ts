import { asDid, type Did } from "@atproto/did";

import type { Handle } from "../../utils/handle.js";
import { asHandle } from "../../utils/handle.js";

type ActorParams = {
  did: string;
  handle?: string;
};

export class Actor {
  readonly did: Did;
  readonly handle: Handle | null; // handle can fail to resolve

  constructor(params: ActorParams) {
    this.did = asDid(params.did);
    this.handle = params.handle ? asHandle(params.handle) : null;
  }
}
