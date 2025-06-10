import type { AppBskyEmbedImages } from "@repo/client/server";

type AspectRatio = {
  width: number;
  height: number;
};

type PostEmbedImageParams = {
  cid: string;
  position: number;
  alt: string;
  aspectRatio?: AspectRatio;
};

export class PostEmbedImage {
  readonly cid: string;
  readonly position: number;
  readonly alt: string;
  readonly aspectRatio?: AspectRatio;

  constructor(params: PostEmbedImageParams) {
    this.cid = params.cid;
    this.position = params.position;
    this.alt = params.alt;
    this.aspectRatio = params.aspectRatio;
  }

  static from(images: AppBskyEmbedImages.Image[]) {
    return images.map((image, index) => {
      return new PostEmbedImage({
        cid: image.image.toJSON().ref.$link,
        position: index,
        alt: image.alt,
        aspectRatio: image.aspectRatio,
      });
    });
  }
}
