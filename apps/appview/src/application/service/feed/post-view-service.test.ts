import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  getTestSetup,
  postEmbedExternalFactory,
  postEmbedImageFactory,
  postEmbedRecordFactory,
  postFactory,
  profileFactory,
  recordFactory,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { HandleResolver } from "../../../infrastructure/handle-resolver.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../../infrastructure/record-repository.js";
import { ProfileViewBuilder } from "../actor/profile-view-builder.js";
import { ProfileViewService } from "../actor/profile-view-service.js";
import { ProfileSearchService } from "../search/profile-search-service.js";
import { PostEmbedViewBuilder } from "./post-embed-view-builder.js";
import { PostViewService } from "./post-view-service.js";

describe("PostViewService", () => {
  const { testInjector, ctx } = getTestSetup();

  const postViewService = testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("handleResolver", HandleResolver)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .injectClass(PostViewService);

  describe("findPostView", () => {
    test("投稿とプロフィールが存在する場合、完全な投稿ビューを取得できる", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Test User" }))
        .props({ handle: () => "test.bsky.social" })
        .create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Hello World",
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T00:00:00.000Z"),
        })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .props({
          text: () => "Hello World",
          createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T00:00:00.000Z"),
        })
        .create();
      const postUri = new AtUri(post.uri);

      // act
      const result = await postViewService.findPostView([postUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: post.uri,
        cid: record.cid,
        author: {
          $type: "app.bsky.actor.defs#profileViewBasic",
          did: actor.did,
          handle: "test.bsky.social",
          displayName: "Test User",
        },
        record: {
          $type: "app.bsky.feed.post",
          text: "Hello World",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        replyCount: 0,
        repostCount: 0,
        likeCount: 0,
        quoteCount: 0,
        indexedAt: "2024-01-01T00:00:00.000Z",
      });
    });

    test("プロフィールの表示名がnullの場合、表示名なしでプロフィールビューを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .props({ handle: () => "noProfile.bsky.social" })
        .create();
      const profileRecord = await recordFactory(
        ctx.db,
        "app.bsky.actor.profile",
      )
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "app.bsky.actor.profile",
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
        })
        .create();
      await profileFactory(ctx.db)
        .vars({ record: () => profileRecord })
        .props({
          displayName: () => null,
          createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
        })
        .create();
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Test post",
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
        })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();
      const postUri = new AtUri(post.uri);

      // act
      const result = await postViewService.findPostView([postUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        author: {
          did: actor.did,
          handle: "noProfile.bsky.social",
          displayName: undefined,
        },
      });
    });

    test("画像埋め込みを含む投稿の場合、画像ビューを含む投稿ビューを取得できる", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Image User" }))
        .props({ handle: () => "imageuser.bsky.social" })
        .create();
      const imageCid =
        "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe";
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({
          json: () => ({
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
                      $link: imageCid,
                    },
                    mimeType: "image/jpeg",
                    size: 123456,
                  },
                },
              ],
            },
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
        })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();
      await postEmbedImageFactory(ctx.db)
        .vars({ post: () => post })
        .props({
          cid: () => imageCid,
          position: () => 0,
          alt: () => "Test image",
        })
        .create();
      const postUri = new AtUri(post.uri);

      // act
      const result = await postViewService.findPostView([postUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        embed: {
          $type: "app.bsky.embed.images#view",
          images: [
            {
              alt: "Test image",
              thumb: `http://localhost:3004/images/feed_thumbnail/${actor.did}/${imageCid}.jpg`,
              fullsize: `http://localhost:3004/images/feed_fullsize/${actor.did}/${imageCid}.jpg`,
            },
          ],
        },
      });
    });

    test("外部リンク埋め込みを含む投稿の場合、外部リンクビューを含む投稿ビューを取得できる", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Link User" }))
        .props({ handle: () => "linkuser.bsky.social" })
        .create();
      const thumbCid =
        "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe";
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({
          json: () => ({
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
                    $link: thumbCid,
                  },
                  mimeType: "image/jpeg",
                  size: 50000,
                },
              },
            },
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
        })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();
      await postEmbedExternalFactory(ctx.db)
        .vars({ post: () => post })
        .props({
          uri: () => "https://example.com",
          title: () => "Example Site",
          description: () => "An example website",
          thumbCid: () => thumbCid,
        })
        .create();
      const postUri = new AtUri(post.uri);

      // act
      const result = await postViewService.findPostView([postUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        embed: {
          $type: "app.bsky.embed.external#view",
          external: {
            uri: "https://example.com",
            title: "Example Site",
            description: "An example website",
            thumb: `http://localhost:3004/images/feed_thumbnail/${actor.did}/${thumbCid}.jpg`,
          },
        },
      });
    });

    test("複数のURIを指定した場合、対応する複数の投稿ビューを取得できる", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "User 1" }))
        .props({ handle: () => "user1.bsky.social" })
        .create();
      const actor2 = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "User 2" }))
        .props({ handle: () => "user2.bsky.social" })
        .create();
      const record1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor1 })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "First post",
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
        })
        .create();
      const record2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor2 })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Second post",
            createdAt: "2024-01-01T01:00:00.000Z",
          }),
        })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => record1 })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => record2 })
        .create();
      const postUri1 = new AtUri(post1.uri);
      const postUri2 = new AtUri(post2.uri);

      // act
      const result = await postViewService.findPostView([postUri1, postUri2]);

      // assert
      expect(result).toHaveLength(2);
      expect(result.map((post) => post.uri)).toEqual([post1.uri, post2.uri]);
    });

    test("存在しない投稿URIが含まれている場合、そのURIは結果に含まれない", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Existing User" }))
        .props({ handle: () => "exists.bsky.social" })
        .create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Existing post",
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
        })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();
      const existingUri = new AtUri(post.uri);
      const nonExistentUri = AtUri.make(
        "did:plc:ghost",
        "app.bsky.feed.post",
        "ghost",
      );

      // act
      const result = await postViewService.findPostView([
        existingUri,
        nonExistentUri,
      ]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: post.uri,
      });
    });

    test("投稿の埋め込み(app.bsky.embed.record)を含む投稿の場合、埋め込み投稿ビューを含む投稿ビューを取得できる", async () => {
      // arrange
      const embeddedAuthor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Embedded Author" }))
        .props({ handle: () => "embedded.bsky.social" })
        .create();
      const embeddedRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => embeddedAuthor })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "This is the embedded post",
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T00:00:00.000Z"),
        })
        .create();
      const embeddedPost = await postFactory(ctx.db)
        .vars({ record: () => embeddedRecord })
        .props({
          text: () => "This is the embedded post",
          createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T00:00:00.000Z"),
        })
        .create();

      const quotingAuthor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Quoting Author" }))
        .props({ handle: () => "quoting.bsky.social" })
        .create();
      const quotingRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => quotingAuthor })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Check out this post!",
            embed: {
              $type: "app.bsky.embed.record",
              record: {
                uri: embeddedPost.uri,
                cid: embeddedPost.cid,
              },
            },
            createdAt: "2024-01-01T01:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();
      const quotingPost = await postFactory(ctx.db)
        .vars({ record: () => quotingRecord })
        .props({
          text: () => "Check out this post!",
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();
      await postEmbedRecordFactory(ctx.db)
        .vars({
          post: () => quotingPost,
          embeddedPost: () => embeddedPost,
        })
        .create();
      const quotingPostUri = new AtUri(quotingPost.uri);

      // act
      const result = await postViewService.findPostView([quotingPostUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: quotingPost.uri,
        cid: quotingRecord.cid,
        author: {
          $type: "app.bsky.actor.defs#profileViewBasic",
          did: quotingAuthor.did,
          handle: "quoting.bsky.social",
          displayName: "Quoting Author",
        },
        record: {
          $type: "app.bsky.feed.post",
          text: "Check out this post!",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: embeddedPost.uri,
              cid: embeddedPost.cid,
            },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        embed: {
          $type: "app.bsky.embed.record#view",
          record: {
            $type: "app.bsky.embed.record#viewRecord",
            uri: embeddedPost.uri,
            cid: embeddedRecord.cid,
            author: {
              $type: "app.bsky.actor.defs#profileViewBasic",
              did: embeddedAuthor.did,
              handle: "embedded.bsky.social",
              displayName: "Embedded Author",
            },
            value: {
              $type: "app.bsky.feed.post",
              text: "This is the embedded post",
              createdAt: "2024-01-01T00:00:00.000Z",
            },
            indexedAt: "2024-01-01T00:00:00.000Z",
            replyCount: 0,
            repostCount: 0,
            likeCount: 0,
            quoteCount: 0,
            embeds: undefined,
          },
        },
        replyCount: 0,
        repostCount: 0,
        likeCount: 0,
        quoteCount: 0,
        indexedAt: "2024-01-01T01:00:00.000Z",
      });
    });

    test("投稿の埋め込み(app.bsky.embed.record)の埋め込み先が存在しない場合、viewNotFoundを含む投稿ビューを取得できる", async () => {
      // arrange
      const quotingAuthor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Quoting Author" }))
        .props({ handle: () => "quoting.bsky.social" })
        .create();
      const notFoundUri = AtUri.make(
        "did:plc:notfound",
        "app.bsky.feed.post",
        "notfound123",
      ).toString();
      const quotingRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => quotingAuthor })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Quoting a deleted post",
            embed: {
              $type: "app.bsky.embed.record",
              record: {
                uri: notFoundUri,
                cid: "bafyreighost123456789",
              },
            },
            createdAt: "2024-01-01T01:00:00.000Z",
          }),
        })
        .create();
      const quotingPost = await postFactory(ctx.db)
        .vars({ record: () => quotingRecord })
        .create();
      await postEmbedRecordFactory(ctx.db)
        .vars({ post: () => quotingPost })
        .props({
          uri: () => notFoundUri,
          cid: () => "bafyreighost123456789",
        })
        .create();
      const quotingPostUri = new AtUri(quotingPost.uri);

      // act
      const result = await postViewService.findPostView([quotingPostUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        embed: {
          $type: "app.bsky.embed.record#view",
          record: {
            $type: "app.bsky.embed.record#viewNotFound",
            uri: notFoundUri,
            notFound: true,
          },
        },
      });
    });
  });
});
