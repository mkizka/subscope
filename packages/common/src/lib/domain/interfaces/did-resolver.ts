import type { Did } from "@atproto/did";

import type { Handle } from "../../utils/handle.js";

export interface IDidResolver {
  resolve: (did: Did) => Promise<{
    signingKey: string;
    handle: Handle;
    pds: URL;
  }>;
}
