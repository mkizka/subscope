import type { Main as Gallery } from "@repo/client/app/bsky/embed/gallery";
import { image } from "@repo/client/app/bsky/embed/gallery";

import { PostEmbedImage } from "./embed-images.js";

export class PostEmbedGallery {
  constructor(readonly images: PostEmbedImage[]) {}

  static from(gallery: Gallery) {
    return new PostEmbedGallery(
      PostEmbedImage.from(gallery.items.filter((item) => image.isTypeOf(item))),
    );
  }
}
