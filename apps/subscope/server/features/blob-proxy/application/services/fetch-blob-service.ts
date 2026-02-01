import type { Did } from "@atproto/did";
import type { IDidResolver } from "@repo/common/domain";

import type { IBlobFetcher } from "@/server/features/blob-proxy/application/interfaces/blob-fetcher.js";
import type { ImageBlob } from "@/server/features/blob-proxy/domain/image-blob.js";

export class FetchBlobService {
  static inject = ["didResolver", "blobFetcher"] as const;

  constructor(
    private didResolver: IDidResolver,
    private blobFetcher: IBlobFetcher,
  ) {}

  async fetchBlob(params: { did: Did; cid: string }): Promise<ImageBlob> {
    const { pds } = await this.didResolver.resolve(params.did);
    const blob = await this.blobFetcher.fetchBlob({
      pds,
      did: params.did,
      cid: params.cid,
    });
    return blob;
  }
}
