import type { $Typed } from "@atproto/lex";
import {
  asAtUriString,
  AtUri,
  toDatetimeString,
  type UriString,
} from "@atproto/syntax";
import type * as AppBskyEmbedExternal from "@repo/client/app/bsky/embed/external";
import type * as AppBskyEmbedGallery from "@repo/client/app/bsky/embed/gallery";
import type * as AppBskyEmbedImages from "@repo/client/app/bsky/embed/images";
import type * as AppBskyEmbedRecord from "@repo/client/app/bsky/embed/record";
import type * as AppBskyEmbedRecordWithMedia from "@repo/client/app/bsky/embed/recordWithMedia";
import type * as AppBskyEmbedVideo from "@repo/client/app/bsky/embed/video";
import { validateRecord } from "@repo/common/utils";

import type {
  PostDto,
  PostEmbedExternalDto,
  PostEmbedImageDto,
  PostEmbedVideoDto,
} from "../dto/post-dto.js";
import type { IAssetUrlBuilder } from "../interfaces/asset-url-builder.js";
import { gateUri } from "../utils/gate-uri.js";
import { asLexMap } from "../utils/lex.js";
import type { GeneratorViews } from "./generator-views.js";
import { toLabelViews } from "./label-views.js";
import type { ProfileViews } from "./profile-views.js";
import type { ViewContext } from "./view-context.js";

const MAX_RECORD_DEPTH = 2;

type EmbeddedRecordParams = {
  uri: AtUri;
  parentUri: string;
  ctx: ViewContext;
  depth: number;
};

const detachedView = (uri: string) =>
  ({
    $type: "app.bsky.embed.record#viewDetached",
    uri: asAtUriString(uri),
    detached: true,
  }) satisfies $Typed<AppBskyEmbedRecord.ViewDetached>;

export class EmbedViews {
  constructor(
    private readonly deps: {
      profileViews: ProfileViews;
      generatorViews: GeneratorViews;
      assetUrlBuilder: IAssetUrlBuilder;
    },
  ) {}

  async embedView({
    post,
    ctx,
    depth = 0,
  }: {
    post: PostDto;
    ctx: ViewContext;
    depth?: number;
  }) {
    const media = this.mediaView(post);
    if (!post.embedRecordUri) {
      return media;
    }
    const record = post.violatesEmbeddingRules
      ? {
          $type: "app.bsky.embed.record#view" as const,
          record: detachedView(post.embedRecordUri),
        }
      : await this.recordView({
          uri: new AtUri(post.embedRecordUri),
          parentUri: post.uri,
          ctx,
          depth,
        });
    if (!media) {
      return record;
    }
    return {
      $type: "app.bsky.embed.recordWithMedia#view" as const,
      record,
      media,
    } satisfies $Typed<AppBskyEmbedRecordWithMedia.View>;
  }

  private mediaView(post: PostDto) {
    if (post.embedImages.length > 0) {
      return this.imagesView(post.embedImages, post.accountDid);
    }
    if (post.embedGallery.length > 0) {
      return this.galleryView(post.embedGallery, post.accountDid);
    }
    if (post.embedVideo) {
      return this.videoView(post.embedVideo, post.accountDid);
    }
    if (post.embedExternal) {
      return this.externalView(post.embedExternal, post.accountDid);
    }
    return undefined;
  }

  private async recordView(
    params: EmbeddedRecordParams,
  ): Promise<$Typed<AppBskyEmbedRecord.View>> {
    const { uri } = params;
    return {
      $type: "app.bsky.embed.record#view",
      record: (await this.embeddedRecord(params)) ?? {
        $type: "app.bsky.embed.record#viewNotFound",
        uri: uri.toString(),
        notFound: true,
      },
    };
  }

  private async embeddedRecord({
    uri,
    parentUri,
    ctx,
    depth,
  }: EmbeddedRecordParams) {
    if (uri.collection === "app.bsky.feed.generator") {
      return await this.deps.generatorViews.generatorView(uri.toString(), ctx);
    }
    if (uri.collection === "app.bsky.feed.post" && depth < MAX_RECORD_DEPTH) {
      const [postgate, view] = await Promise.all([
        ctx.record(gateUri(uri.toString(), "app.bsky.feed.postgate")),
        this.viewRecord({ uri: uri.toString(), ctx, depth: depth + 1 }),
      ]);
      const detached =
        postgate &&
        validateRecord(
          "app.bsky.feed.postgate",
          postgate,
        ).detachedEmbeddingUris?.includes(asAtUriString(parentUri));
      if (detached) {
        return detachedView(uri.toString());
      }
      return view;
    }
    return undefined;
  }

  private async viewRecord({
    uri,
    ctx,
    depth,
  }: {
    uri: string;
    ctx: ViewContext;
    depth: number;
  }): Promise<$Typed<AppBskyEmbedRecord.ViewRecord> | undefined> {
    const post = await ctx.post(uri);
    if (!post) {
      return undefined;
    }
    const [record, author, stats, embed, labels] = await Promise.all([
      ctx.record(uri),
      this.deps.profileViews.basic(post.accountDid, ctx),
      ctx.stats(uri),
      this.embedView({ post, ctx, depth }),
      ctx.labelsOf(uri),
    ]);
    if (!record || !author) {
      return undefined;
    }
    return {
      $type: "app.bsky.embed.record#viewRecord",
      uri: post.uri,
      cid: record.cid,
      author,
      value: asLexMap(record.json),
      replyCount: stats?.replyCount ?? 0,
      repostCount: stats?.repostCount ?? 0,
      likeCount: stats?.likeCount ?? 0,
      quoteCount: stats?.quoteCount ?? 0,
      embeds: embed ? [embed] : [],
      labels: toLabelViews(labels),
      indexedAt: toDatetimeString(post.indexedAt),
    };
  }

  private externalView(
    embed: PostEmbedExternalDto,
    accountDid: string,
  ): $Typed<AppBskyEmbedExternal.View> {
    return {
      $type: "app.bsky.embed.external#view",
      external: {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        uri: embed.uri as UriString,
        title: embed.title,
        description: embed.description,
        thumb: embed.thumbCid
          ? this.deps.assetUrlBuilder.getFeedThumbnailUrl(
              accountDid,
              embed.thumbCid,
            )
          : undefined,
      },
    };
  }

  private videoView(
    embed: PostEmbedVideoDto,
    accountDid: string,
  ): $Typed<AppBskyEmbedVideo.View> {
    return {
      $type: "app.bsky.embed.video#view",
      cid: embed.cid,
      playlist: this.deps.assetUrlBuilder.getVideoPlaylistUrl(
        accountDid,
        embed.cid,
      ),
      thumbnail: this.deps.assetUrlBuilder.getVideoThumbnailUrl(
        accountDid,
        embed.cid,
      ),
      alt: embed.alt ?? undefined,
      aspectRatio: embed.aspectRatio,
      presentation: embed.presentation ?? undefined,
    };
  }

  private imagesView(
    images: PostEmbedImageDto[],
    accountDid: string,
  ): $Typed<AppBskyEmbedImages.View> {
    return {
      $type: "app.bsky.embed.images#view",
      images: images.map((image) => ({
        alt: image.alt,
        thumb: this.deps.assetUrlBuilder.getFeedThumbnailUrl(
          accountDid,
          image.cid,
        ),
        fullsize: this.deps.assetUrlBuilder.getFeedFullsizeUrl(
          accountDid,
          image.cid,
        ),
        aspectRatio: image.aspectRatio,
      })),
    };
  }

  private galleryView(
    images: PostEmbedImageDto[],
    accountDid: string,
  ): $Typed<AppBskyEmbedGallery.View> {
    return {
      $type: "app.bsky.embed.gallery#view",
      items: images.map((image) => ({
        $type: "app.bsky.embed.gallery#viewImage" as const,
        alt: image.alt,
        thumbnail: this.deps.assetUrlBuilder.getFeedThumbnailUrl(
          accountDid,
          image.cid,
        ),
        fullsize: this.deps.assetUrlBuilder.getFeedFullsizeUrl(
          accountDid,
          image.cid,
        ),
        aspectRatio: image.aspectRatio ?? { width: 1, height: 1 },
      })),
    };
  }
}
