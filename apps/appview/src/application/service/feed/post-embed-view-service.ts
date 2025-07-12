import type {
  $Typed,
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyFeedDefs,
} from "@repo/client/server";
import {
  PostEmbedExternal,
  type PostEmbedImage,
  PostEmbedRecord,
} from "@repo/common/domain";

import { env } from "../../../shared/env.js";

export class PostEmbedViewService {
  toView(
    embed: PostEmbedExternal | PostEmbedImage[] | PostEmbedRecord | null,
    actorDid: string,
    embedPostViewMap?: Map<string, $Typed<AppBskyFeedDefs.PostView>>,
  ) {
    if (Array.isArray(embed)) {
      return this.toImagesView(embed, actorDid);
    }
    if (embed instanceof PostEmbedExternal) {
      return this.toExternalView(embed, actorDid);
    }
    if (embed instanceof PostEmbedRecord) {
      return this.toRecordView(embed, embedPostViewMap);
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
    embedPostViewMap?: Map<string, $Typed<AppBskyFeedDefs.PostView>>,
  ): $Typed<AppBskyEmbedRecord.View> {
    const postView = embedPostViewMap?.get(embed.uri.toString());

    if (postView) {
      return {
        $type: "app.bsky.embed.record#view" as const,
        record: {
          $type: "app.bsky.embed.record#viewRecord" as const,
          uri: postView.uri,
          cid: postView.cid,
          author: postView.author,
          value: postView.record,
          indexedAt: postView.indexedAt,
          replyCount: postView.replyCount,
          repostCount: postView.repostCount,
          likeCount: postView.likeCount,
          quoteCount: postView.quoteCount,
          embeds: postView.embed ? [postView.embed] : undefined,
        },
      };
    }

    // 見つからない場合は従来通りviewNotFoundを返す
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
