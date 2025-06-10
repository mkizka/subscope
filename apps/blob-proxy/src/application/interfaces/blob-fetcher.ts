import type { Did } from "@atproto/did";

import type { ImageBlob } from "../../domain/image-blob.js";

export interface IBlobFetcher {
  fetchBlob: (pdsUrl: string, did: Did, cid: string) => Promise<ImageBlob>;
}
