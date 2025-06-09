export type ImagePresetType = keyof typeof IMAGE_PRESETS;

export class ImagePreset {
  private constructor(
    public readonly fit: "cover" | "inside",
    public readonly width: number,
    public readonly height: number,
  ) {}

  static avatar(): ImagePreset {
    return new ImagePreset("cover", 1000, 1000);
  }

  static avatarThumbnail(): ImagePreset {
    return new ImagePreset("cover", 128, 128);
  }

  static banner(): ImagePreset {
    return new ImagePreset("cover", 3000, 1000);
  }

  static feedThumbnail(): ImagePreset {
    return new ImagePreset("inside", 2000, 2000);
  }

  static feedFullsize(): ImagePreset {
    return new ImagePreset("inside", 1000, 1000);
  }

  static fromType(type: ImagePresetType): ImagePreset {
    return IMAGE_PRESETS[type]();
  }
}

export const IMAGE_PRESETS = {
  avatar: () => ImagePreset.avatar(),
  avatar_thumbnail: () => ImagePreset.avatarThumbnail(),
  banner: () => ImagePreset.banner(),
  feed_thumbnail: () => ImagePreset.feedThumbnail(),
  feed_fullsize: () => ImagePreset.feedFullsize(),
} as const;
