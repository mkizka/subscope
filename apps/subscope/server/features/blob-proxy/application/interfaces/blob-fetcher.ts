import type { Did } from "@atproto/did";

import type { ImageBlob } from "@/server/features/blob-proxy/domain/image-blob.js";

export interface IBlobFetcher {
  fetchBlob: (params: {
    pds: URL;
    did: Did;
    cid: string;
  }) => Promise<ImageBlob>;
}

export class BlobFetchFailedError extends Error {
  constructor(errorName: string) {
    super(`Failed to fetch blob: ${errorName}`);
    this.name = "BlobFetchFailedError";
  }
}
