import type {
  $Typed,
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
} from "@repo/client/server";
import type { Post } from "@repo/common/domain";
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
    post: Post,
    embedMaps?: {
      viewRecordMap: Map<string, $Typed<AppBskyEmbedRecord.ViewRecord>>;
      generatorViewMap: Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>;
    },
  ) {
    if (Array.isArray(post.embed)) {
      return this.imagesView(post.embed, post.actorDid);
    }
    if (post.embed instanceof PostEmbedExternal) {
      return this.externalView(post.embed, post.actorDid);
    }
    if (post.embed instanceof PostEmbedRecord) {
      return this.recordView(post.embed, embedMaps);
    }
    if (post.embed instanceof PostEmbedRecordWithMedia) {
      return this.recordWithMediaView(post.embed, post.actorDid, embedMaps);
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
    embedMaps?: {
      viewRecordMap: Map<string, $Typed<AppBskyEmbedRecord.ViewRecord>>;
      generatorViewMap: Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>;
    },
  ): $Typed<AppBskyEmbedRecord.View> {
    const viewRecord = embedMaps?.viewRecordMap.get(embed.uri.toString());
    if (viewRecord) {
      return {
        $type: "app.bsky.embed.record#view" as const,
        record: viewRecord,
      };
    }

    const generatorView = embedMaps?.generatorViewMap.get(embed.uri.toString());
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
    embedMaps?: {
      viewRecordMap: Map<string, $Typed<AppBskyEmbedRecord.ViewRecord>>;
      generatorViewMap: Map<string, $Typed<AppBskyFeedDefs.GeneratorView>>;
    },
  ): $Typed<AppBskyEmbedRecordWithMedia.View> {
    const recordView = this.recordView(
      new PostEmbedRecord({
        uri: embed.uri,
        cid: embed.cid,
      }),
      embedMaps,
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
