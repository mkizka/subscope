import type { Did } from "@atproto/did";

import type { IBlobFetcher } from "../application/interfaces/blob-fetcher.js";
import { BlobFetchFailedError } from "../application/interfaces/blob-fetcher.js";
import type { ImageBlob } from "../domain/image-blob.js";

type FetchParams = {
  pds: URL;
  did: Did;
  cid: string;
};

export class InMemoryBlobFetcher implements IBlobFetcher {
  private results: Map<string, ImageBlob> = new Map();
  private errors: Map<string, string> = new Map();

  setFetchResult(params: FetchParams, blob: ImageBlob): void {
    const key = this.getKey(params);
    this.results.set(key, blob);
  }

  setFetchError(params: FetchParams, errorName: string): void {
    const key = this.getKey(params);
    this.errors.set(key, errorName);
  }

  clear(): void {
    this.results.clear();
    this.errors.clear();
  }

  fetchBlob(params: FetchParams): Promise<ImageBlob> {
    const key = this.getKey(params);

    const error = this.errors.get(key);
    if (error) {
      return Promise.reject(new BlobFetchFailedError(error));
    }

    const result = this.results.get(key);
    if (!result) {
      return Promise.reject(new Error(`No fetch result set for ${key}`));
    }

    return Promise.resolve(result);
  }

  private getKey(params: FetchParams): string {
    return `${params.pds.toString()}:${params.did}:${params.cid}`;
  }
}
