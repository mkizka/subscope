import type { Did } from "@atproto/did";
import type { IDidResolver } from "@repo/common/domain";

import type { ImageBlob } from "../domain/blob-data.js";
import type { IBlobFetcher } from "./interfaces/blob-fetcher.js";

export class FetchBlobService {
  static inject = ["didResolver", "blobFetcher"] as const;

  constructor(
    private didResolver: IDidResolver,
    private blobFetcher: IBlobFetcher,
  ) {}

  async fetchBlob(did: Did, cid: string): Promise<ImageBlob> {
    const resolved = await this.didResolver.resolve(did);
    const pdsUrl = resolved.pds.toString();
    return await this.blobFetcher.fetchBlob(pdsUrl, did, cid);
  }
}
