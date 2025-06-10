import type { Did } from "@atproto/did";
import { AtpBaseClient } from "@repo/client/api";

import type { IBlobFetcher } from "../application/interfaces/blob-fetcher.js";
import { BlobData } from "../domain/blob-data.js";

export class BlobFetcher implements IBlobFetcher {
  async fetchBlob(pdsUrl: string, did: Did, cid: string): Promise<BlobData> {
    const client = new AtpBaseClient({
      service: pdsUrl,
    });
    const response = await client.com.atproto.sync.getBlob({
      did,
      cid,
    });
    return new BlobData(
      response.data,
      response.headers["content-type"] || "application/octet-stream",
    );
  }
}
