import { getBlobCidString } from "@atproto/lex";
import type { Image } from "@repo/client/lex/app/bsky/embed/images";

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

  static from(images: Image[]) {
    return images.map((image, index) => {
      return new PostEmbedImage({
        cid: getBlobCidString(image.image),
        position: index,
        alt: image.alt,
        aspectRatio: image.aspectRatio,
      });
    });
  }
}
