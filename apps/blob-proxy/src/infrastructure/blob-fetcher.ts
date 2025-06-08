import type { Did } from "@atproto/did";
import { AtpBaseClient } from "@dawn/client/api";

import type { IBlobFetcher } from "../application/interfaces/blob-fetcher.js";
import type { BlobData } from "../shared/types.js";

export class BlobFetcher implements IBlobFetcher {
  async fetchBlob(pdsUrl: string, did: Did, cid: string): Promise<BlobData> {
    const client = new AtpBaseClient({
      service: pdsUrl,
    });
    const response = await client.com.atproto.sync.getBlob({
      did,
      cid,
    });
    return {
      data: response.data,
      contentType:
        response.headers["content-type"] || "application/octet-stream",
    };
  }
}
