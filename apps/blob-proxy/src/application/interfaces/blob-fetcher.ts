import type { Did } from "@atproto/did";

import type { BlobData } from "../../domain/blob-data.js";

export interface IBlobFetcher {
  fetchBlob: (pdsUrl: string, did: Did, cid: string) => Promise<BlobData>;
}
