import { type Did, isDid } from "@atproto/did";

import { ImagePreset } from "./image-preset.js";

export class ImageProxyRequest {
  readonly did: Did;
  readonly cid: string;
  readonly preset: ImagePreset;

  private constructor(params: { did: Did; cid: string; preset: ImagePreset }) {
    this.did = params.did;
    this.cid = params.cid;
    this.preset = params.preset;
  }

  static fromParams(params: {
    did: string;
    cid: string;
    type: string;
  }): ImageProxyRequest {
    this.assertDid(params.did);
    return new ImageProxyRequest({
      did: params.did,
      cid: params.cid,
      preset: ImagePreset.fromType(params.type),
    });
  }

  static assertDid(did: string): asserts did is Did {
    if (!isDid(did)) {
      throw new InvalidDidError(did);
    }
  }

  getCacheKey(): string {
    return `${this.preset.type}/${this.did}/${this.cid}`;
  }
}

export class InvalidDidError extends Error {
  constructor(did: string) {
    super(`${did} is not a valid DID`);
    this.name = "InvalidDidError";
  }
}
