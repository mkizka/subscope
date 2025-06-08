import type {
  $Typed,
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
} from "@dawn/client/server";
import type { PostEmbedExternal, PostEmbedImage } from "@dawn/common/domain";

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
          ? `https://cdn.bsky.app/img/feed_thumbnail/plain/${actorDid}/${embed.thumbCid}@jpeg`
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
        thumb: `https://cdn.bsky.app/img/feed_thumbnail/plain/${actorDid}/${image.cid}@jpeg`,
        fullsize: `https://cdn.bsky.app/img/feed_fullsize/plain/${actorDid}/${image.cid}@jpeg`,
        aspectRatio: image.aspectRatio,
      })),
    };
  }
}
