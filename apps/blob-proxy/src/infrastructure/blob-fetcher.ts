import type { Did } from "@atproto/did";
import { AtpBaseClient } from "@repo/client/api";

import type { IBlobFetcher } from "../application/interfaces/blob-fetcher.js";
import { ImageBlob } from "../domain/image-blob.js";

export class BlobFetcher implements IBlobFetcher {
  async fetchBlob(pdsUrl: string, did: Did, cid: string): Promise<ImageBlob> {
    const client = new AtpBaseClient({
      service: pdsUrl,
    });
    const response = await client.com.atproto.sync.getBlob({
      did,
      cid,
    });
    return new ImageBlob({
      data: response.data,
      contentType:
        response.headers["content-type"] || "application/octet-stream",
    });
  }
}
