import type { AppBskyEmbedImages } from "@dawn/client/server";

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

  toJSON(actorDid: string) {
    return {
      alt: this.alt,
      thumb: `https://cdn.bsky.app/img/feed_thumbnail/plain/${actorDid}/${this.cid}@jpeg`,
      fullsize: `https://cdn.bsky.app/img/feed_fullsize/plain/${actorDid}/${this.cid}@jpeg`,
      aspectRatio: this.aspectRatio,
    } satisfies AppBskyEmbedImages.ViewImage;
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
