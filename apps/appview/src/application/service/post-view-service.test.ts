import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { HandleResolver } from "../../infrastructure/handle-resolver.js";
import { PostRepository } from "../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../infrastructure/record-repository.js";
import { EmbedViewService } from "./embed-view-service.js";
import { PostViewService } from "./post-view-service.js";
import { ProfileViewService } from "./profile-view-service.js";

let postViewService: PostViewService;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  postViewService = testSetup.testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("handleResolver", HandleResolver)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("embedViewService", EmbedViewService)
    .provideClass("profileViewService", ProfileViewService)
    .injectClass(PostViewService);
  ctx = testSetup.ctx;
});

describe("PostViewService", () => {
  describe("findPostView", () => {
    it("投稿とプロフィールが存在する場合、完全な投稿ビューを取得できる", async () => {
      // Arrange
      const postUri = AtUri.make("did:plc:123", "app.bsky.feed.post", "abc123");
      const actorDid = "did:plc:123";
      const postRecord = {
        $type: "app.bsky.feed.post",
        text: "Hello World",
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      await ctx.db.insert(schema.actors).values({
        did: actorDid,
        handle: "test.bsky.social",
      });

      await ctx.db.insert(schema.records).values({
        uri: postUri.toString(),
        cid: "bafyreiabc123",
        actorDid,
        json: postRecord,
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.posts).values({
        uri: postUri.toString(),
        cid: "bafyreiabc123",
        actorDid,
        text: "Hello World",
        createdAt: new Date(postRecord.createdAt),
      });

      const profileUri = `at://${actorDid}/app.bsky.actor.profile/self`;
      await ctx.db.insert(schema.records).values({
        uri: profileUri,
        cid: "bafyreiprofile",
        actorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Test User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.profiles).values({
        uri: profileUri,
        cid: "bafyreiprofile",
        actorDid,
        displayName: "Test User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      // Act
      const result = await postViewService.findPostView([postUri]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: postUri.toString(),
        cid: "bafyreiabc123",
        author: {
          $type: "app.bsky.actor.defs#profileViewBasic",
          did: actorDid,
          handle: "test.bsky.social",
          displayName: "Test User",
        },
        record: postRecord,
        replyCount: 0,
        repostCount: 0,
        likeCount: 0,
        quoteCount: 0,
        indexedAt: "2024-01-01T00:00:00.000Z",
      });
    });

    it("プロフィールが存在しない場合はデフォルト値を使用する", async () => {
      // Arrange
      const postUri = AtUri.make("did:plc:456", "app.bsky.feed.post", "def456");
      const actorDid = "did:plc:456";
      const postRecord = {
        $type: "app.bsky.feed.post",
        text: "Test post",
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      await ctx.db.insert(schema.actors).values({
        did: actorDid,
        handle: "noProfile.bsky.social",
      });

      await ctx.db.insert(schema.records).values({
        uri: postUri.toString(),
        cid: "bafyreidef456",
        actorDid,
        json: postRecord,
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.posts).values({
        uri: postUri.toString(),
        cid: "bafyreidef456",
        actorDid,
        text: "Test post",
        createdAt: new Date(postRecord.createdAt),
      });

      // Act
      const result = await postViewService.findPostView([postUri]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.author).toMatchObject({
        did: actorDid,
        handle: "handle.invalid",
      });
    });

    it("画像埋め込みを含む投稿の場合、画像ビューを含む投稿ビューを取得できる", async () => {
      // Arrange
      const postUri = AtUri.make("did:plc:789", "app.bsky.feed.post", "img789");
      const actorDid = "did:plc:789";
      const postRecord = {
        $type: "app.bsky.feed.post",
        text: "Post with images",
        embed: {
          $type: "app.bsky.embed.images",
          images: [
            {
              alt: "Test image",
              image: {
                $type: "blob",
                ref: {
                  $link:
                    "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe",
                },
                mimeType: "image/jpeg",
                size: 123456,
              },
            },
          ],
        },
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      await ctx.db.insert(schema.actors).values({
        did: actorDid,
        handle: "imageuser.bsky.social",
      });

      await ctx.db.insert(schema.records).values({
        uri: postUri.toString(),
        cid: "bafyreiimg789",
        actorDid,
        json: postRecord,
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.posts).values({
        uri: postUri.toString(),
        cid: "bafyreiimg789",
        actorDid,
        text: "Post with images",
        createdAt: new Date(postRecord.createdAt),
      });

      await ctx.db.insert(schema.postEmbedImages).values({
        postUri: postUri.toString(),
        cid: "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe",
        position: 0,
        alt: "Test image",
      });

      const profileUri = `at://${actorDid}/app.bsky.actor.profile/self`;
      await ctx.db.insert(schema.records).values({
        uri: profileUri,
        cid: "bafyreiprofile",
        actorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Image User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.profiles).values({
        uri: profileUri,
        cid: "bafyreiprofile",
        actorDid,
        displayName: "Image User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      // Act
      const result = await postViewService.findPostView([postUri]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.embed).toMatchObject({
        $type: "app.bsky.embed.images#view",
        images: [
          {
            alt: "Test image",
            thumb: `http://localhost:3004/images/feed_thumbnail/${actorDid}/bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe.jpg`,
            fullsize: `http://localhost:3004/images/feed_fullsize/${actorDid}/bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe.jpg`,
          },
        ],
      });
    });

    it("外部リンク埋め込みを含む投稿の場合、外部リンクビューを含む投稿ビューを取得できる", async () => {
      // Arrange
      const postUri = AtUri.make("did:plc:ext", "app.bsky.feed.post", "ext123");
      const actorDid = "did:plc:ext";
      const postRecord = {
        $type: "app.bsky.feed.post",
        text: "Post with external link",
        embed: {
          $type: "app.bsky.embed.external",
          external: {
            uri: "https://example.com",
            title: "Example Site",
            description: "An example website",
            thumb: {
              $type: "blob",
              ref: {
                $link:
                  "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe",
              },
              mimeType: "image/jpeg",
              size: 50000,
            },
          },
        },
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      await ctx.db.insert(schema.actors).values({
        did: actorDid,
        handle: "linkuser.bsky.social",
      });

      await ctx.db.insert(schema.records).values({
        uri: postUri.toString(),
        cid: "bafyreiext123",
        actorDid,
        json: postRecord,
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.posts).values({
        uri: postUri.toString(),
        cid: "bafyreiext123",
        actorDid,
        text: "Post with external link",
        createdAt: new Date(postRecord.createdAt),
      });

      await ctx.db.insert(schema.postEmbedExternals).values({
        postUri: postUri.toString(),
        uri: "https://example.com",
        title: "Example Site",
        description: "An example website",
        thumbCid: "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe",
      });

      const profileUri = `at://${actorDid}/app.bsky.actor.profile/self`;
      await ctx.db.insert(schema.records).values({
        uri: profileUri,
        cid: "bafyreiprofile",
        actorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Link User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.profiles).values({
        uri: profileUri,
        cid: "bafyreiprofile",
        actorDid,
        displayName: "Link User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      // Act
      const result = await postViewService.findPostView([postUri]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.embed).toMatchObject({
        $type: "app.bsky.embed.external#view",
        external: {
          uri: "https://example.com",
          title: "Example Site",
          description: "An example website",
          thumb: `http://localhost:3004/images/feed_thumbnail/${actorDid}/bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe.jpg`,
        },
      });
    });

    it("複数のURIを指定した場合、対応する複数の投稿ビューを取得できる", async () => {
      // Arrange
      const postUri1 = AtUri.make(
        "did:plc:multi1",
        "app.bsky.feed.post",
        "post1",
      );
      const postUri2 = AtUri.make(
        "did:plc:multi2",
        "app.bsky.feed.post",
        "post2",
      );
      const actorDid1 = "did:plc:multi1";
      const actorDid2 = "did:plc:multi2";

      await ctx.db.insert(schema.actors).values([
        { did: actorDid1, handle: "user1.bsky.social" },
        { did: actorDid2, handle: "user2.bsky.social" },
      ]);

      await ctx.db.insert(schema.records).values([
        {
          uri: postUri1.toString(),
          cid: "bafyreipost1",
          actorDid: actorDid1,
          json: {
            $type: "app.bsky.feed.post",
            text: "First post",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: postUri2.toString(),
          cid: "bafyreipost2",
          actorDid: actorDid2,
          json: {
            $type: "app.bsky.feed.post",
            text: "Second post",
            createdAt: "2024-01-01T01:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T01:00:00.000Z"),
        },
      ]);

      await ctx.db.insert(schema.posts).values([
        {
          uri: postUri1.toString(),
          cid: "bafyreipost1",
          actorDid: actorDid1,
          text: "First post",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: postUri2.toString(),
          cid: "bafyreipost2",
          actorDid: actorDid2,
          text: "Second post",
          createdAt: new Date("2024-01-01T01:00:00.000Z"),
        },
      ]);

      // Act
      const result = await postViewService.findPostView([postUri1, postUri2]);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((post) => post.uri)).toEqual([
        postUri1.toString(),
        postUri2.toString(),
      ]);
    });

    it("存在しない投稿URIが含まれている場合、そのURIは結果に含まれない", async () => {
      // Arrange
      const existingUri = AtUri.make(
        "did:plc:exists",
        "app.bsky.feed.post",
        "exists",
      );
      const nonExistentUri = AtUri.make(
        "did:plc:ghost",
        "app.bsky.feed.post",
        "ghost",
      );
      const actorDid = "did:plc:exists";

      await ctx.db.insert(schema.actors).values({
        did: actorDid,
        handle: "exists.bsky.social",
      });

      await ctx.db.insert(schema.records).values({
        uri: existingUri.toString(),
        cid: "bafyreiexists",
        actorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Existing post",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.posts).values({
        uri: existingUri.toString(),
        cid: "bafyreiexists",
        actorDid,
        text: "Existing post",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      // Act
      const result = await postViewService.findPostView([
        existingUri,
        nonExistentUri,
      ]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBe(existingUri.toString());
    });
  });
});
