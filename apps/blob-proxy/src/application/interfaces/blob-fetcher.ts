import type { Did } from "@atproto/did";

import type { BlobData } from "../../shared/types.js";

export interface IBlobFetcher {
  fetchBlob: (pdsUrl: string, did: Did, cid: string) => Promise<BlobData>;
}
