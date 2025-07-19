import type {
  $Typed,
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
} from "@repo/client/server";
import {
  PostEmbedExternal,
  type PostEmbedImage,
  PostEmbedRecord,
  PostEmbedRecordWithMedia,
} from "@repo/common/domain";

import type { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";

export class PostEmbedViewBuilder {
  constructor(private readonly assetUrlBuilder: AssetUrlBuilder) {}
  static inject = ["assetUrlBuilder"] as const;

  embedView(
    embed:
      | PostEmbedExternal
      | PostEmbedImage[]
      | PostEmbedRecord
      | PostEmbedRecordWithMedia
      | null,
    actorDid: string,
    embedPostViewMap?: Map<string, $Typed<AppBskyFeedDefs.PostView>>,
    embedGeneratorViewMap?: Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>,
  ) {
    if (Array.isArray(embed)) {
      return this.imagesView(embed, actorDid);
    }
    if (embed instanceof PostEmbedExternal) {
      return this.externalView(embed, actorDid);
    }
    if (embed instanceof PostEmbedRecord) {
      return this.recordView(embed, embedPostViewMap, embedGeneratorViewMap);
    }
    if (embed instanceof PostEmbedRecordWithMedia) {
      return this.recordWithMediaView(
        embed,
        actorDid,
        embedPostViewMap,
        embedGeneratorViewMap,
      );
    }
    return undefined;
  }

  private externalView(
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
          ? this.assetUrlBuilder.getFeedThumbnailUrl(actorDid, embed.thumbCid)
          : undefined,
      },
    };
  }

  private imagesView(
    images: PostEmbedImage[],
    actorDid: string,
  ): $Typed<AppBskyEmbedImages.View> {
    return {
      $type: "app.bsky.embed.images#view" as const,
      images: images.map((image) => ({
        alt: image.alt,
        thumb: this.assetUrlBuilder.getFeedThumbnailUrl(actorDid, image.cid),
        fullsize: this.assetUrlBuilder.getFeedFullsizeUrl(actorDid, image.cid),
        aspectRatio: image.aspectRatio,
      })),
    };
  }

  private recordView(
    embed: PostEmbedRecord,
    // TODO: postViewではなくviewRecordを渡すことはできるか確認
    embedPostViewMap?: Map<string, $Typed<AppBskyFeedDefs.PostView>>,
    embedGeneratorViewMap?: Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>,
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

    const generatorView = embedGeneratorViewMap?.get(embed.uri.toString());
    if (generatorView) {
      return {
        $type: "app.bsky.embed.record#view" as const,
        record: generatorView,
      };
    }

    return {
      $type: "app.bsky.embed.record#view" as const,
      record: {
        $type: "app.bsky.embed.record#viewNotFound" as const,
        uri: embed.uri.toString(),
        notFound: true,
      },
    };
  }

  private recordWithMediaView(
    embed: PostEmbedRecordWithMedia,
    actorDid: string,
    embedPostViewMap?: Map<string, $Typed<AppBskyFeedDefs.PostView>>,
    embedGeneratorViewMap?: Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>,
  ): $Typed<AppBskyEmbedRecordWithMedia.View> {
    const recordView = this.recordView(
      new PostEmbedRecord({
        uri: embed.uri,
        cid: embed.cid,
      }),
      embedPostViewMap,
      embedGeneratorViewMap,
    );

    const mediaView = Array.isArray(embed.media)
      ? this.imagesView(embed.media, actorDid)
      : this.externalView(embed.media, actorDid);

    return {
      $type: "app.bsky.embed.recordWithMedia#view" as const,
      record: recordView,
      media: mediaView,
    };
  }
}
