import type { Did } from "@atproto/did";
import { XRPCError } from "@atproto/xrpc";
import { AtpBaseClient } from "@repo/client/api";

import {
  BlobFetchFailedError,
  type IBlobFetcher,
} from "../application/interfaces/blob-fetcher.js";
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
    let response;
    try {
      response = await client.com.atproto.sync.getBlob({
        did: params.did,
        cid: params.cid,
      });
    } catch (e) {
      if (e instanceof XRPCError) {
        throw new BlobFetchFailedError(e.error);
      }
      throw e;
    }
    return new ImageBlob({
      data: response.data,
      contentType:
        response.headers["content-type"] || "application/octet-stream",
    });
  }
}
