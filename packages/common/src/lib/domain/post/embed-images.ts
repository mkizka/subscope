import type { AppBskyEmbedImages } from "@dawn/client/server";

export class PostEmbedImage {
  constructor(
    readonly cid: string,
    readonly position: number,
    readonly alt: string,
    readonly aspectRatio?: { width: number; height: number },
  ) {}

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
      return new PostEmbedImage(
        image.image.toJSON().ref.$link,
        index,
        image.alt,
        image.aspectRatio,
      );
    });
  }
}
