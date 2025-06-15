import type {
  $Typed,
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
} from "@repo/client/server";
import type { PostEmbedExternal, PostEmbedImage } from "@repo/common/domain";

import { env } from "../../shared/env.js";

// TODO: 投稿の埋め込みに対応
export class EmbedViewService {
  toView(embed: PostEmbedExternal | PostEmbedImage[] | null, actorDid: string) {
    if (Array.isArray(embed)) {
      return this.toImagesView(embed, actorDid);
    }
    if (embed) {
      return this.toExternalView(embed, actorDid);
    }
    return undefined;
  }

  private toExternalView(
    embed: PostEmbedExternal,
    actorDid: string,
  ): $Typed<AppBskyEmbedExternal.View> {
    return {
      $type: "app.bsky.embed.external#view" as const,
      external: {
        uri: embed.uri,
        title: embed.title,
        description: embed.description,
        thumb: embed.thumbCid
          ? `${env.BLOB_PROXY_URL}/images/feed_thumbnail/${actorDid}/${embed.thumbCid}.jpg`
          : undefined,
      },
    };
  }

  private toImagesView(
    images: PostEmbedImage[],
    actorDid: string,
  ): $Typed<AppBskyEmbedImages.View> {
    return {
      $type: "app.bsky.embed.images#view" as const,
      images: images.map((image) => ({
        alt: image.alt,
        thumb: `${env.BLOB_PROXY_URL}/images/feed_thumbnail/${actorDid}/${image.cid}.jpg`,
        fullsize: `${env.BLOB_PROXY_URL}/images/feed_fullsize/${actorDid}/${image.cid}.jpg`,
        aspectRatio: image.aspectRatio,
      })),
    };
  }
}
