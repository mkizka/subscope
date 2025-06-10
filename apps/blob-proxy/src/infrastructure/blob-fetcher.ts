import type { Did } from "@atproto/did";
import { AtpBaseClient } from "@repo/client/api";

import type { IBlobFetcher } from "../application/interfaces/blob-fetcher.js";
import { ImageBlob } from "../domain/image-blob.js";

export class BlobFetcher implements IBlobFetcher {
  async fetchBlob(params: {
    pds: URL;
    did: Did;
    cid: string;
  }): Promise<ImageBlob> {
    const client = new AtpBaseClient({
      service: params.pds.toString(),
    });
    const response = await client.com.atproto.sync.getBlob({
      did: params.did,
      cid: params.cid,
    });
    return new ImageBlob({
      data: response.data,
      contentType:
        response.headers["content-type"] || "application/octet-stream",
    });
  }
}
