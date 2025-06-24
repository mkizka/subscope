import type {
  $Typed,
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
} from "@repo/client/server";
import {
  PostEmbedExternal,
  type PostEmbedImage,
  PostEmbedRecord,
} from "@repo/common/domain";

import { env } from "../../shared/env.js";

export class EmbedViewService {
  toView(
    embed: PostEmbedExternal | PostEmbedImage[] | PostEmbedRecord | null,
    actorDid: string,
  ) {
    if (Array.isArray(embed)) {
      return this.toImagesView(embed, actorDid);
    }
    if (embed instanceof PostEmbedExternal) {
      return this.toExternalView(embed, actorDid);
    }
    if (embed instanceof PostEmbedRecord) {
      return this.toRecordView(embed);
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

  private toRecordView(
    embed: PostEmbedRecord,
  ): $Typed<AppBskyEmbedRecord.View> {
    // 現在の実装では、ViewNotFoundを返す
    // 将来的には埋め込まれた投稿の情報を取得して返す
    return {
      $type: "app.bsky.embed.record#view" as const,
      record: {
        $type: "app.bsky.embed.record#viewNotFound" as const,
        uri: embed.uri.toString(),
        notFound: true,
      },
    };
  }
}
