import { getBlobCidString } from "@atproto/lex";
export class PostEmbedImage {
  cid;
  position;
  alt;
  aspectRatio;
  constructor(params) {
    this.cid = params.cid;
    this.position = params.position;
    this.alt = params.alt;
    this.aspectRatio = params.aspectRatio;
  }
  static from(images) {
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
