import type { Did } from "@atproto/did";

import type { IBlobFetcher } from "../application/interfaces/blob-fetcher.js";
import { BlobFetchFailedError } from "../application/interfaces/blob-fetcher.js";
import type { ImageBlob } from "../domain/image-blob.js";

type FetchParams = {
  pds: URL;
  did: Did;
  cid: string;
};

type FetchResult = { blob: ImageBlob } | { error: string };

export class InMemoryBlobFetcher implements IBlobFetcher {
  private results: Map<string, FetchResult> = new Map();

  setFetchResult(params: FetchParams, blob: ImageBlob): void {
    const key = this.getKey(params);
    this.results.set(key, { blob });
  }

  setFetchError(params: FetchParams, errorName: string): void {
    const key = this.getKey(params);
    this.results.set(key, { error: errorName });
  }

  clear(): void {
    this.results.clear();
  }

  fetchBlob(params: FetchParams): Promise<ImageBlob> {
    const key = this.getKey(params);
    const result = this.results.get(key);

    if (!result) {
      return Promise.reject(new Error(`No fetch result set for ${key}`));
    }

    if ("error" in result) {
      return Promise.reject(new BlobFetchFailedError(result.error));
    }

    return Promise.resolve(result.blob);
  }

  private getKey(params: FetchParams): string {
    return `${params.pds.toString()}:${params.did}:${params.cid}`;
  }
}
