import { asDid, type Did } from "@atproto/did";

import { IMAGE_PRESETS, type ImagePresetType } from "./image-preset.js";

export class ImageTransformRequest {
  constructor(
    public readonly did: Did,
    public readonly cid: string,
    public readonly presetType: ImagePresetType,
  ) {}

  getCacheKey(): string {
    return `${this.presetType}/${this.did}/${this.cid}/`;
  }

  static from(params: {
    did: string;
    cid: string;
    type: string;
  }): ImageTransformRequest {
    const did = this.validateDid(params.did);
    const presetType = this.validatePresetType(params.type);

    return new ImageTransformRequest(did, params.cid, presetType);
  }

  private static validateDid(didString: string): Did {
    try {
      return asDid(didString);
    } catch {
      throw new InvalidDidError(didString);
    }
  }

  private static validatePresetType(type: string): ImagePresetType {
    if (this.isValidPresetType(type)) {
      return type;
    }
    throw new InvalidImagePresetError(type);
  }

  private static isValidPresetType(type: string): type is ImagePresetType {
    return type in IMAGE_PRESETS;
  }
}

export class InvalidImagePresetError extends Error {
  constructor(presetType: string) {
    super(`Invalid image preset type: ${presetType}`);
    this.name = "InvalidImagePresetError";
  }
}

export class InvalidDidError extends Error {
  constructor(did: string) {
    super(`Invalid DID format: ${did}`);
    this.name = "InvalidDidError";
  }
}
