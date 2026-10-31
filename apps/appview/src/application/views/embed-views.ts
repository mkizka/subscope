import type { $Typed } from "@atproto/lex";
import {
  asAtUriString,
  AtUri,
  toDatetimeString,
  type UriString,
} from "@atproto/syntax";
import type * as AppBskyEmbedExternal from "@repo/client/lex/app/bsky/embed/external";
import type * as AppBskyEmbedImages from "@repo/client/lex/app/bsky/embed/images";
import type * as AppBskyEmbedRecord from "@repo/client/lex/app/bsky/embed/record";
import type * as AppBskyEmbedRecordWithMedia from "@repo/client/lex/app/bsky/embed/recordWithMedia";
import { Record } from "@repo/common/domain";

import type {
  PostDto,
  PostEmbedExternalDto,
  PostEmbedImageDto,
} from "../dto/post-dto.js";
import type { IAssetUrlBuilder } from "../interfaces/asset-url-builder.js";
import { gateUri } from "../utils/gate-uri.js";
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

  async embedView(post: PostDto, ctx: ViewContext, depth = 0) {
    const media = this.mediaView(post);
    if (!post.embedRecordUri) {
      return media;
    }
    const record = await this.recordView(
      new AtUri(post.embedRecordUri),
      post.uri,
      ctx,
      depth,
    );
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
      return this.imagesView(post.embedImages, post.actorDid);
    }
    if (post.embedExternal) {
      return this.externalView(post.embedExternal, post.actorDid);
    }
    return undefined;
  }

  private async recordView(
    uri: AtUri,
    parentUri: string,
    ctx: ViewContext,
    depth: number,
  ): Promise<$Typed<AppBskyEmbedRecord.View>> {
    return {
      $type: "app.bsky.embed.record#view",
      record: (await this.embeddedRecord(uri, parentUri, ctx, depth)) ?? {
        $type: "app.bsky.embed.record#viewNotFound",
        uri: uri.toString(),
        notFound: true,
      },
    };
  }

  private async embeddedRecord(
    uri: AtUri,
    parentUri: string,
    ctx: ViewContext,
    depth: number,
  ) {
    if (uri.collection === "app.bsky.feed.generator") {
      return await this.generatorViews.generatorView(uri.toString(), ctx);
    }
    if (uri.collection === "app.bsky.feed.post" && depth < MAX_RECORD_DEPTH) {
      const [postgate, view] = await Promise.all([
        ctx.record(gateUri(uri.toString(), "app.bsky.feed.postgate")),
        this.viewRecord(uri.toString(), ctx, depth + 1),
      ]);
      const detached =
        postgate &&
        Record.create(postgate)
          .validate("app.bsky.feed.postgate")
          .detachedEmbeddingUris?.includes(asAtUriString(parentUri));
      if (detached) {
        return {
          $type: "app.bsky.embed.record#viewDetached" as const,
          uri: uri.toString(),
          detached: true as const,
        } satisfies $Typed<AppBskyEmbedRecord.ViewDetached>;
      }
      return view;
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
      uri: post.uri,
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

  private externalView(
    embed: PostEmbedExternalDto,
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
    images: PostEmbedImageDto[],
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
