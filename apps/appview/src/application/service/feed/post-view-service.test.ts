import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  generatorFactory,
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
import { GeneratorRepository } from "../../../infrastructure/generator-repository.js";
import { HandleResolver } from "../../../infrastructure/handle-resolver.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../../infrastructure/record-repository.js";
import { ProfileViewBuilder } from "../actor/profile-view-builder.js";
import { ProfileViewService } from "../actor/profile-view-service.js";
import { ProfileSearchService } from "../search/profile-search-service.js";
import { GeneratorViewService } from "./generator-view-service.js";
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
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("generatorRepository", GeneratorRepository)
    .provideClass("generatorViewService", GeneratorViewService)
    .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
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
        record: {
          text: "Quoting a deleted post",
        },
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

    test("フィードジェネレーターの埋め込み(app.bsky.embed.record)の場合、ジェネレータービューを含む投稿ビューを取得できる", async () => {
      // arrange
      const generatorActor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Generator Creator" }))
        .props({ handle: () => "generator.bsky.social" })
        .create();
      const generatorRecord = await recordFactory(
        ctx.db,
        "app.bsky.feed.generator",
      )
        .vars({ actor: () => generatorActor })
        .create();
      const generator = await generatorFactory(ctx.db)
        .vars({ record: () => generatorRecord })
        .props({
          displayName: () => "My Cool Feed",
          description: () => "A custom algorithmic feed",
          avatarCid: () => "bafyreiavatarcid123",
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
            text: "Check out this feed!",
            embed: {
              $type: "app.bsky.embed.record",
              record: {
                uri: generator.uri,
                cid: generator.cid,
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
          text: () => "Check out this feed!",
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();
      await postEmbedRecordFactory(ctx.db)
        .vars({ post: () => quotingPost })
        .props({
          uri: () => generator.uri,
          cid: () => generator.cid,
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
          text: "Check out this feed!",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: generator.uri,
              cid: generator.cid,
            },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        embed: {
          $type: "app.bsky.embed.record#view",
          record: {
            $type: "app.bsky.feed.defs#generatorView",
            uri: generator.uri,
            cid: generator.cid,
            did: generator.did,
            creator: {
              $type: "app.bsky.actor.defs#profileView",
              did: generatorActor.did,
              handle: "generator.bsky.social",
              displayName: "Generator Creator",
            },
            displayName: "My Cool Feed",
            description: "A custom algorithmic feed",
            avatar: `http://localhost:3004/images/avatar_thumbnail/${generatorActor.did}/bafyreiavatarcid123.jpg`,
            indexedAt: generator.indexedAt.toISOString(),
          },
        },
        replyCount: 0,
        repostCount: 0,
        likeCount: 0,
        quoteCount: 0,
        indexedAt: "2024-01-01T01:00:00.000Z",
      });
    });

    test("フィードジェネレーターの埋め込み先が存在しない場合、viewNotFoundを含む投稿ビューを取得できる", async () => {
      // arrange
      const quotingAuthor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Quoting Author" }))
        .props({ handle: () => "quoting.bsky.social" })
        .create();
      const notFoundGeneratorUri = AtUri.make(
        "did:plc:notfound",
        "app.bsky.feed.generator",
        "notfound123",
      ).toString();
      const quotingRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => quotingAuthor })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Quoting a deleted generator",
            embed: {
              $type: "app.bsky.embed.record",
              record: {
                uri: notFoundGeneratorUri,
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
          uri: () => notFoundGeneratorUri,
          cid: () => "bafyreighost123456789",
        })
        .create();
      const quotingPostUri = new AtUri(quotingPost.uri);

      // act
      const result = await postViewService.findPostView([quotingPostUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        record: {
          text: "Quoting a deleted generator",
        },
        embed: {
          $type: "app.bsky.embed.record#view",
          record: {
            $type: "app.bsky.embed.record#viewNotFound",
            uri: notFoundGeneratorUri,
            notFound: true,
          },
        },
      });
    });

    test("embedがapp.bsky.embed.recordWithMedia#viewの場合、画像と投稿の両方を含む埋め込みビューを取得できる", async () => {
      // arrange
      // 埋め込まれる投稿の作成
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

      // recordWithMediaを含む投稿の作成
      const mainAuthor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Main Author" }))
        .props({ handle: () => "main.bsky.social" })
        .create();
      const imageCid1 =
        "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe";
      const imageCid2 =
        "bafyreihg3cyqnx3cekbrrqxifcrphjkemcblsp5p4gey5ytnvqegeconoq";
      const mainRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => mainAuthor })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Post with both images and quoted post",
            embed: {
              $type: "app.bsky.embed.recordWithMedia",
              record: {
                record: {
                  uri: embeddedPost.uri,
                  cid: embeddedPost.cid,
                },
              },
              media: {
                $type: "app.bsky.embed.images",
                images: [
                  {
                    alt: "First image",
                    image: {
                      $type: "blob",
                      ref: {
                        $link: imageCid1,
                      },
                      mimeType: "image/jpeg",
                      size: 123456,
                    },
                  },
                  {
                    alt: "Second image",
                    image: {
                      $type: "blob",
                      ref: {
                        $link: imageCid2,
                      },
                      mimeType: "image/png",
                      size: 234567,
                    },
                  },
                ],
              },
            },
            createdAt: "2024-01-01T01:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();
      const mainPost = await postFactory(ctx.db)
        .vars({ record: () => mainRecord })
        .props({
          text: () => "Post with both images and quoted post",
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      // 画像の埋め込みデータを作成
      await postEmbedImageFactory(ctx.db)
        .vars({ post: () => mainPost })
        .props({
          cid: () => imageCid1,
          position: () => 0,
          alt: () => "First image",
        })
        .create();
      await postEmbedImageFactory(ctx.db)
        .vars({ post: () => mainPost })
        .props({
          cid: () => imageCid2,
          position: () => 1,
          alt: () => "Second image",
        })
        .create();

      // 投稿の埋め込みデータを作成
      await postEmbedRecordFactory(ctx.db)
        .vars({
          post: () => mainPost,
          embeddedPost: () => embeddedPost,
        })
        .create();

      const mainPostUri = new AtUri(mainPost.uri);

      // act
      const result = await postViewService.findPostView([mainPostUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: mainPost.uri,
        cid: mainRecord.cid,
        author: {
          $type: "app.bsky.actor.defs#profileViewBasic",
          did: mainAuthor.did,
          handle: "main.bsky.social",
          displayName: "Main Author",
        },
        record: {
          $type: "app.bsky.feed.post",
          text: "Post with both images and quoted post",
          embed: {
            $type: "app.bsky.embed.recordWithMedia",
            record: {
              record: {
                uri: embeddedPost.uri,
                cid: embeddedPost.cid,
              },
            },
            media: {
              $type: "app.bsky.embed.images",
              images: [
                {
                  alt: "First image",
                  image: {
                    $type: "blob",
                    ref: {
                      $link: imageCid1,
                    },
                    mimeType: "image/jpeg",
                    size: 123456,
                  },
                },
                {
                  alt: "Second image",
                  image: {
                    $type: "blob",
                    ref: {
                      $link: imageCid2,
                    },
                    mimeType: "image/png",
                    size: 234567,
                  },
                },
              ],
            },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        embed: {
          $type: "app.bsky.embed.recordWithMedia#view",
          record: {
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
            },
          },
          media: {
            $type: "app.bsky.embed.images#view",
            images: [
              {
                alt: "First image",
                thumb: `http://localhost:3004/images/feed_thumbnail/${mainAuthor.did}/${imageCid1}.jpg`,
                fullsize: `http://localhost:3004/images/feed_fullsize/${mainAuthor.did}/${imageCid1}.jpg`,
              },
              {
                alt: "Second image",
                thumb: `http://localhost:3004/images/feed_thumbnail/${mainAuthor.did}/${imageCid2}.jpg`,
                fullsize: `http://localhost:3004/images/feed_fullsize/${mainAuthor.did}/${imageCid2}.jpg`,
              },
            ],
          },
        },
        replyCount: 0,
        repostCount: 0,
        likeCount: 0,
        quoteCount: 0,
        indexedAt: "2024-01-01T01:00:00.000Z",
      });
    });

    test("埋め込みの埋め込み（A→B→C）の場合、3階層すべての投稿ビューを取得できる", async () => {
      // arrange
      // C: 最初の投稿
      const authorC = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Author C" }))
        .props({ handle: () => "authorc.bsky.social" })
        .create();
      const recordC = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => authorC })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Original post C",
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T00:00:00.000Z"),
        })
        .create();
      const postC = await postFactory(ctx.db)
        .vars({ record: () => recordC })
        .props({
          text: () => "Original post C",
          createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T00:00:00.000Z"),
        })
        .create();

      // B: Cを埋め込む投稿
      const authorB = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Author B" }))
        .props({ handle: () => "authorb.bsky.social" })
        .create();
      const recordB = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => authorB })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Quoting post C",
            embed: {
              $type: "app.bsky.embed.record",
              record: {
                uri: postC.uri,
                cid: postC.cid,
              },
            },
            createdAt: "2024-01-01T01:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();
      const postB = await postFactory(ctx.db)
        .vars({ record: () => recordB })
        .props({
          text: () => "Quoting post C",
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();
      await postEmbedRecordFactory(ctx.db)
        .vars({
          post: () => postB,
          embeddedPost: () => postC,
        })
        .create();

      // A: Bを埋め込む投稿
      const authorA = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Author A" }))
        .props({ handle: () => "authora.bsky.social" })
        .create();
      const recordA = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => authorA })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Quoting post B",
            embed: {
              $type: "app.bsky.embed.record",
              record: {
                uri: postB.uri,
                cid: postB.cid,
              },
            },
            createdAt: "2024-01-01T02:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();
      const postA = await postFactory(ctx.db)
        .vars({ record: () => recordA })
        .props({
          text: () => "Quoting post B",
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();
      await postEmbedRecordFactory(ctx.db)
        .vars({
          post: () => postA,
          embeddedPost: () => postB,
        })
        .create();

      const postAUri = new AtUri(postA.uri);

      // act
      const result = await postViewService.findPostView([postAUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: postA.uri,
        author: {
          displayName: "Author A",
        },
        record: {
          text: "Quoting post B",
        },
        embed: {
          $type: "app.bsky.embed.record#view",
          record: {
            $type: "app.bsky.embed.record#viewRecord",
            uri: postB.uri,
            author: {
              displayName: "Author B",
            },
            value: {
              text: "Quoting post C",
            },
            embeds: [
              {
                $type: "app.bsky.embed.record#view",
                record: {
                  $type: "app.bsky.embed.record#viewRecord",
                  uri: postC.uri,
                  author: {
                    displayName: "Author C",
                  },
                  value: {
                    text: "Original post C",
                  },
                },
              },
            ],
          },
        },
      });
    });

    test("埋め込みの深度が最大2階層に制限されることを確認（A→B→C→Dのパターン）", async () => {
      // arrange
      // D: 最深の投稿
      const authorD = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Author D" }))
        .props({ handle: () => "authord.bsky.social" })
        .create();
      const recordD = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => authorD })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Original post D",
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T00:00:00.000Z"),
        })
        .create();
      const postD = await postFactory(ctx.db)
        .vars({ record: () => recordD })
        .props({
          text: () => "Original post D",
          createdAt: () => new Date("2024-01-01T00:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T00:00:00.000Z"),
        })
        .create();

      // C: Dを埋め込む投稿
      const authorC = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Author C" }))
        .props({ handle: () => "authorc.bsky.social" })
        .create();
      const recordC = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => authorC })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Quoting post D",
            embed: {
              $type: "app.bsky.embed.record",
              record: {
                uri: postD.uri,
                cid: postD.cid,
              },
            },
            createdAt: "2024-01-01T01:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();
      const postC = await postFactory(ctx.db)
        .vars({ record: () => recordC })
        .props({
          text: () => "Quoting post D",
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();
      await postEmbedRecordFactory(ctx.db)
        .vars({
          post: () => postC,
          embeddedPost: () => postD,
        })
        .create();

      // B: Cを埋め込む投稿
      const authorB = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Author B" }))
        .props({ handle: () => "authorb.bsky.social" })
        .create();
      const recordB = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => authorB })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Quoting post C",
            embed: {
              $type: "app.bsky.embed.record",
              record: {
                uri: postC.uri,
                cid: postC.cid,
              },
            },
            createdAt: "2024-01-01T02:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();
      const postB = await postFactory(ctx.db)
        .vars({ record: () => recordB })
        .props({
          text: () => "Quoting post C",
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();
      await postEmbedRecordFactory(ctx.db)
        .vars({
          post: () => postB,
          embeddedPost: () => postC,
        })
        .create();

      // A: Bを埋め込む投稿
      const authorA = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Author A" }))
        .props({ handle: () => "authora.bsky.social" })
        .create();
      const recordA = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => authorA })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Quoting post B",
            embed: {
              $type: "app.bsky.embed.record",
              record: {
                uri: postB.uri,
                cid: postB.cid,
              },
            },
            createdAt: "2024-01-01T03:00:00.000Z",
          }),
          indexedAt: () => new Date("2024-01-01T03:00:00.000Z"),
        })
        .create();
      const postA = await postFactory(ctx.db)
        .vars({ record: () => recordA })
        .props({
          text: () => "Quoting post B",
          createdAt: () => new Date("2024-01-01T03:00:00.000Z"),
          indexedAt: () => new Date("2024-01-01T03:00:00.000Z"),
        })
        .create();
      await postEmbedRecordFactory(ctx.db)
        .vars({
          post: () => postA,
          embeddedPost: () => postB,
        })
        .create();

      const postAUri = new AtUri(postA.uri);

      // act
      const result = await postViewService.findPostView([postAUri]);

      // assert
      expect(result).toHaveLength(1);
      // A→B→Cまでは取得されるが、Dは取得されない（notFoundになる）
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: postA.uri,
        author: {
          displayName: "Author A",
        },
        record: {
          text: "Quoting post B",
        },
        embed: {
          $type: "app.bsky.embed.record#view",
          record: {
            $type: "app.bsky.embed.record#viewRecord",
            uri: postB.uri,
            author: {
              displayName: "Author B",
            },
            value: {
              text: "Quoting post C",
            },
            embeds: [
              {
                $type: "app.bsky.embed.record#view",
                record: {
                  $type: "app.bsky.embed.record#viewRecord",
                  uri: postC.uri,
                  author: {
                    displayName: "Author C",
                  },
                  value: {
                    text: "Quoting post D",
                  },
                  // Dの埋め込みは深度制限により取得されないため、embedsはundefinedになる
                },
              },
            ],
          },
        },
      });
    });
  });
});
