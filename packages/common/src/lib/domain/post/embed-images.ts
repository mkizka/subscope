import type { AppBskyEmbedImages } from "@dawn/client/server";

export class PostEmbedImage {
  constructor(
    readonly cid: string,
    readonly position: number,
    readonly alt: string,
  ) {}

  static from(images: AppBskyEmbedImages.Image[]) {
    return images.map((image, index) => {
      return new PostEmbedImage(
        image.image.toJSON().ref.$link,
        index,
        image.alt,
      );
    });
  }
}
