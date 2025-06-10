import { asDid, type Did } from "@atproto/did";

import { ImagePreset } from "./image-preset.js";

export class ImageTransformRequest {
  readonly did: Did;
  readonly cid: string;
  readonly preset: ImagePreset;

  constructor(params: { did: string; cid: string; type: string }) {
    this.did = asDid(params.did);
    this.cid = params.cid;
    this.preset = new ImagePreset(params.type);
  }

  getCacheKey(): string {
    return `${this.preset.type}/${this.did}/${this.cid}/`;
  }
}
