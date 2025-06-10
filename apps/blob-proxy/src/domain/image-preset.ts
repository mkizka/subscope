type ImagePresetConfig = {
  fit: "cover" | "inside";
  width: number;
  height: number;
};

const IMAGE_PRESETS = {
  avatar: {
    fit: "cover",
    width: 1000,
    height: 1000,
  },
  avatar_thumbnail: {
    fit: "cover",
    width: 128,
    height: 128,
  },
  banner: {
    fit: "cover",
    width: 3000,
    height: 1000,
  },
  feed_thumbnail: {
    fit: "inside",
    width: 2000,
    height: 2000,
  },
  feed_fullsize: {
    fit: "inside",
    width: 1000,
    height: 1000,
  },
} as const satisfies {
  [key: string]: ImagePresetConfig;
};

export type ImagePresetType = keyof typeof IMAGE_PRESETS;

export class ImagePreset {
  readonly type: ImagePresetType;

  constructor(type: string) {
    if (!ImagePreset.isValidType(type)) {
      throw new InvalidImagePresetTypeError(type);
    }
    this.type = type;
  }

  static isValidType(type: string): type is ImagePresetType {
    return type in IMAGE_PRESETS;
  }

  getValue(): ImagePresetConfig {
    return IMAGE_PRESETS[this.type];
  }
}

export class InvalidImagePresetTypeError extends Error {
  constructor(type: string) {
    super(`Invalid image preset type: ${type}`);
    this.name = "InvalidImagePresetTypeError";
  }
}
