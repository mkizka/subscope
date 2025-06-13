import type { Did } from "@atproto/did";

import type { ImageBlob } from "../../domain/image-blob.js";

export interface IBlobFetcher {
  fetchBlob: (params: {
    pds: URL;
    did: Did;
    cid: string;
  }) => Promise<ImageBlob | null>;
}
