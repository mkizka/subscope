import type { $Typed } from "@atproto/lex";
import { type AtUri, toDatetimeString, type UriString } from "@atproto/syntax";
import type * as AppBskyEmbedExternal from "@repo/client/lex/app/bsky/embed/external";
import type * as AppBskyEmbedImages from "@repo/client/lex/app/bsky/embed/images";
import type * as AppBskyEmbedRecord from "@repo/client/lex/app/bsky/embed/record";
import type * as AppBskyEmbedRecordWithMedia from "@repo/client/lex/app/bsky/embed/recordWithMedia";
import {
  type Post,
  PostEmbedExternal,
  type PostEmbedImage,
  PostEmbedRecord,
  PostEmbedRecordWithMedia,
} from "@repo/common/domain";

import type { IAssetUrlBuilder } from "../interfaces/asset-url-builder.js";
import { asLexMap } from "../utils/lex.js";
import type { GeneratorViews } from "./generator-views.js";
import type { ProfileViews } from "./profile-views.js";
import type { ViewContext } from "./view-context.js";

const MAX_RECORD_DEPTH = 2;

export class EmbedViews {
  constructor(
    private readonly profileViews: ProfileViews,
    private readonly generatorViews: GeneratorViews,
    private readonly assetUrlBuilder: IAssetUrlBuilder,
  ) {}

  async embedView(post: Post, ctx: ViewContext, depth = 0) {
    if (Array.isArray(post.embed)) {
      return this.imagesView(post.embed, post.actorDid);
    }
    if (post.embed instanceof PostEmbedExternal) {
      return this.externalView(post.embed, post.actorDid);
    }
    if (post.embed instanceof PostEmbedRecord) {
      return await this.recordView(post.embed.uri, ctx, depth);
    }
    if (post.embed instanceof PostEmbedRecordWithMedia) {
      return await this.recordWithMediaView(
        post.embed,
        post.actorDid,
        ctx,
        depth,
      );
    }
    return undefined;
  }

  private async recordView(
    uri: AtUri,
    ctx: ViewContext,
    depth: number,
  ): Promise<$Typed<AppBskyEmbedRecord.View>> {
    return {
      $type: "app.bsky.embed.record#view",
      record: (await this.embeddedRecord(uri, ctx, depth)) ?? {
        $type: "app.bsky.embed.record#viewNotFound",
        uri: uri.toString(),
        notFound: true,
      },
    };
  }

  private async embeddedRecord(uri: AtUri, ctx: ViewContext, depth: number) {
    if (uri.collection === "app.bsky.feed.generator") {
      return await this.generatorViews.generatorView(uri.toString(), ctx);
    }
    if (uri.collection === "app.bsky.feed.post" && depth < MAX_RECORD_DEPTH) {
      return await this.viewRecord(uri.toString(), ctx, depth + 1);
    }
    return undefined;
  }

  private async viewRecord(
    uri: string,
    ctx: ViewContext,
    depth: number,
  ): Promise<$Typed<AppBskyEmbedRecord.ViewRecord> | undefined> {
    const post = await ctx.post(uri);
    if (!post) {
      return undefined;
    }
    const [record, author, stats, embed] = await Promise.all([
      ctx.record(uri),
      this.profileViews.basic(post.actorDid, ctx),
      ctx.stats(uri),
      this.embedView(post, ctx, depth),
    ]);
    if (!record || !author) {
      return undefined;
    }
    return {
      $type: "app.bsky.embed.record#viewRecord",
      uri: post.uri.toString(),
      cid: record.cid,
      author,
      value: asLexMap(record.json),
      replyCount: stats?.replyCount ?? 0,
      repostCount: stats?.repostCount ?? 0,
      likeCount: stats?.likeCount ?? 0,
      quoteCount: stats?.quoteCount ?? 0,
      embeds: embed ? [embed] : [],
      indexedAt: toDatetimeString(post.indexedAt),
    };
  }

  private async recordWithMediaView(
    embed: PostEmbedRecordWithMedia,
    actorDid: string,
    ctx: ViewContext,
    depth: number,
  ): Promise<$Typed<AppBskyEmbedRecordWithMedia.View>> {
    return {
      $type: "app.bsky.embed.recordWithMedia#view",
      record: await this.recordView(embed.uri, ctx, depth),
      media: Array.isArray(embed.media)
        ? this.imagesView(embed.media, actorDid)
        : this.externalView(embed.media, actorDid),
    };
  }

  private externalView(
    embed: PostEmbedExternal,
    actorDid: string,
  ): $Typed<AppBskyEmbedExternal.View> {
    return {
      $type: "app.bsky.embed.external#view",
      external: {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        uri: embed.uri as UriString,
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
      $type: "app.bsky.embed.images#view",
      images: images.map((image) => ({
        alt: image.alt,
        thumb: this.assetUrlBuilder.getFeedThumbnailUrl(actorDid, image.cid),
        fullsize: this.assetUrlBuilder.getFeedFullsizeUrl(actorDid, image.cid),
        aspectRatio: image.aspectRatio,
      })),
    };
  }
}
