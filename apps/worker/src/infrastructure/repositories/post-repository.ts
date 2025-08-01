import {
  type Post,
  PostEmbedExternal,
  type PostEmbedImage,
  PostEmbedRecord,
  PostEmbedRecordWithMedia,
  type TransactionContext,
} from "@repo/common/domain";
import { type PostInsert, schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IPostRepository } from "../../application/interfaces/repositories/post-repository.js";

export class PostRepository implements IPostRepository {
  async upsert({ ctx, post }: { ctx: TransactionContext; post: Post }) {
    const postUri = post.uri.toString();
    const data = {
      cid: post.cid,
      actorDid: post.actorDid,
      text: post.text,
      replyRootUri: post.replyRoot?.uri.toString(),
      replyRootCid: post.replyRoot?.cid,
      replyParentUri: post.replyParent?.uri.toString(),
      replyParentCid: post.replyParent?.cid,
      langs: post.langs,
      createdAt: post.createdAt,
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

    if (post.embed) {
      if (Array.isArray(post.embed)) {
        await this.upsertEmbedImages(ctx, postUri, post.embed);
      } else if (post.embed instanceof PostEmbedExternal) {
        await this.upsertEmbedExternal(ctx, postUri, post.embed);
      } else if (post.embed instanceof PostEmbedRecord) {
        await this.upsertEmbedRecord(ctx, postUri, post.embed);
      } else if (post.embed instanceof PostEmbedRecordWithMedia) {
        await this.upsertEmbedRecordWithMedia(ctx, postUri, post.embed);
      }
    }
  }

  private async upsertEmbedImages(
    ctx: TransactionContext,
    postUri: string,
    embedImages: PostEmbedImage[],
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
          alt: image.alt,
          aspectRatioWidth: image.aspectRatio?.width,
          aspectRatioHeight: image.aspectRatio?.height,
        })),
      );
    }
  }

  private async upsertEmbedExternal(
    ctx: TransactionContext,
    postUri: string,
    embedExternal: PostEmbedExternal,
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
    embedRecord: PostEmbedRecord,
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

  private async upsertEmbedRecordWithMedia(
    ctx: TransactionContext,
    postUri: string,
    embedRecordWithMedia: PostEmbedRecordWithMedia,
  ) {
    // record部分を保存
    await ctx.db
      .insert(schema.postEmbedRecords)
      .values({
        postUri,
        uri: embedRecordWithMedia.uri.toString(),
        cid: embedRecordWithMedia.cid,
      })
      .onConflictDoUpdate({
        target: schema.postEmbedRecords.postUri,
        set: {
          uri: embedRecordWithMedia.uri.toString(),
          cid: embedRecordWithMedia.cid,
        },
      });

    // media部分を保存
    if (Array.isArray(embedRecordWithMedia.media)) {
      await this.upsertEmbedImages(ctx, postUri, embedRecordWithMedia.media);
    } else if (embedRecordWithMedia.media instanceof PostEmbedExternal) {
      await this.upsertEmbedExternal(ctx, postUri, embedRecordWithMedia.media);
    }
  }

  async exists(ctx: TransactionContext, uri: string): Promise<boolean> {
    const result = await ctx.db
      .select({ uri: schema.posts.uri })
      .from(schema.posts)
      .where(eq(schema.posts.uri, uri))
      .limit(1);

    return result.length > 0;
  }
}
