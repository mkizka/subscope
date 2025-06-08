import type {
  Post,
  PostEmbedImage,
  TransactionContext,
} from "@dawn/common/domain";
import { type PostInsert, schema } from "@dawn/db";
import { eq, inArray } from "drizzle-orm";

import type { IPostRepository } from "../application/interfaces/repositories/post-repository.js";

export class PostRepository implements IPostRepository {
  async upsert({ ctx, post }: { ctx: TransactionContext; post: Post }) {
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
        uri: post.uri.toString(),
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.posts.uri,
        set: data,
      });

    // 画像埋め込みがある場合は関連テーブルに保存
    if (post.embed) {
      await this.upsertEmbedImages(ctx, post.uri.toString(), post.embed);
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
        })),
      );
    }
  }

  async existsAny(ctx: TransactionContext, uris: string[]): Promise<boolean> {
    if (uris.length === 0) {
      return false;
    }

    const result = await ctx.db
      .select({ uri: schema.posts.uri })
      .from(schema.posts)
      .where(inArray(schema.posts.uri, uris))
      .limit(1);

    return result.length > 0;
  }
}
