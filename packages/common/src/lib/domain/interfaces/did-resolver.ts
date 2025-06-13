import type { Did } from "@atproto/did";

import type { Handle } from "../../utils/handle.js";

export interface IDidResolver {
  resolve: (did: Did) => Promise<{
    signingKey: string;
    handle: Handle;
    pds: URL;
  }>;
}

export class DidResolutionError extends Error {
  constructor(did: string) {
    super(`Failed to resolve DID: ${did} `);
    this.name = "DidResolutionError";
  }
}
