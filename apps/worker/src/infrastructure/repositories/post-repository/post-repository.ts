import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";
import { type PostInsert, schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type {
  EmbedImage,
  EmbedMedia,
  Post,
  PostEmbed,
} from "../../../application/dto/post.js";
import type { IPostRepository } from "../../../application/interfaces/repositories/post-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class PostRepository implements IPostRepository {
  async save({ ctx, post }: { ctx: TransactionContext; post: Post }) {
    const postUri = post.uri.toString();
    const data = {
      cid: post.cid,
      accountDid: post.accountDid,
      text: post.text,
      replyRootUri: post.replyRoot?.uri.toString(),
      replyRootCid: post.replyRoot?.cid,
      replyParentUri: post.replyParent?.uri.toString(),
      replyParentCid: post.replyParent?.cid,
      langs: post.langs,
      createdAt: sanitizeDate(post.createdAt),
    } satisfies PostInsert;
    await ctx.db
      .insert(schema.posts)
      .values({
        uri: postUri,
        indexedAt: post.indexedAt,
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.posts.uri,
        set: data,
      });

    const { embed } = post;
    if (!embed) return;
    if (embed.type === "record" || embed.type === "recordWithMedia") {
      await this.upsertEmbedRecord(ctx, postUri, embed);
    }
    const media = embed.type === "recordWithMedia" ? embed.media : embed;
    if (media.type === "external") {
      await this.upsertEmbedExternal(ctx, postUri, media);
    } else if (media.type === "video") {
      await this.upsertEmbedVideo(ctx, postUri, media);
    } else if (media.type === "images" || media.type === "gallery") {
      await this.upsertEmbedImages(ctx, postUri, media.images, media.type);
    }
  }

  private async upsertEmbedImages(
    ctx: TransactionContext,
    postUri: string,
    embedImages: EmbedImage[],
    embedType: "images" | "gallery",
  ) {
    // 添付画像には一意なIDがないので、既存の画像を削除してから新しい画像を挿入
    await ctx.db
      .delete(schema.postEmbedImages)
      .where(eq(schema.postEmbedImages.postUri, postUri));

    if (embedImages.length > 0) {
      await ctx.db.insert(schema.postEmbedImages).values(
        embedImages.map((image, index) => ({
          postUri,
          cid: image.cid,
          position: index,
          embedType,
          alt: image.alt,
          aspectRatioWidth: image.aspectRatio?.width,
          aspectRatioHeight: image.aspectRatio?.height,
        })),
      );
    }
  }

  private async upsertEmbedVideo(
    ctx: TransactionContext,
    postUri: string,
    embedVideo: Extract<EmbedMedia, { type: "video" }>,
  ) {
    const data = {
      cid: embedVideo.cid,
      alt: embedVideo.alt,
      aspectRatioWidth: embedVideo.aspectRatio?.width,
      aspectRatioHeight: embedVideo.aspectRatio?.height,
      presentation: embedVideo.presentation,
    };
    await ctx.db
      .insert(schema.postEmbedVideos)
      .values({ postUri, ...data })
      .onConflictDoUpdate({
        target: schema.postEmbedVideos.postUri,
        set: data,
      });
  }

  private async upsertEmbedExternal(
    ctx: TransactionContext,
    postUri: string,
    embedExternal: Extract<EmbedMedia, { type: "external" }>,
  ) {
    await ctx.db
      .insert(schema.postEmbedExternals)
      .values({
        postUri,
        uri: embedExternal.uri,
        title: embedExternal.title,
        description: embedExternal.description,
        thumbCid: embedExternal.thumbCid,
      })
      .onConflictDoUpdate({
        target: schema.postEmbedExternals.postUri,
        set: {
          uri: embedExternal.uri,
          title: embedExternal.title,
          description: embedExternal.description,
          thumbCid: embedExternal.thumbCid,
        },
      });
  }

  private async upsertEmbedRecord(
    ctx: TransactionContext,
    postUri: string,
    embedRecord: Extract<PostEmbed, { uri: AtUri }>,
  ) {
    await ctx.db
      .insert(schema.postEmbedRecords)
      .values({
        postUri,
        uri: embedRecord.uri.toString(),
        cid: embedRecord.cid,
      })
      .onConflictDoUpdate({
        target: schema.postEmbedRecords.postUri,
        set: {
          uri: embedRecord.uri.toString(),
          cid: embedRecord.cid,
        },
      });
  }
}
