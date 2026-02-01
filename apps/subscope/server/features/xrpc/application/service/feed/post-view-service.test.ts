import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  PostEmbedExternal,
  PostEmbedImage,
  PostEmbedRecord,
  PostEmbedRecordWithMedia,
} from "@repo/common/domain";
import {
  actorFactory,
  generatorFactory,
  likeFactory,
  postFactory,
  profileDetailedFactory,
  recordFactory,
  repostFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "@/server/features/xrpc/test-utils.js";

import { PostViewService } from "./post-view-service.js";

describe("PostViewService", () => {
  const postViewService = testInjector.injectClass(PostViewService);

  const postRepo = testInjector.resolve("postRepository");
  const recordRepo = testInjector.resolve("recordRepository");
  const profileRepo = testInjector.resolve("profileRepository");
  const generatorRepo = testInjector.resolve("generatorRepository");
  const likeRepo = testInjector.resolve("likeRepository");
  const repostRepo = testInjector.resolve("repostRepository");

  describe("findPostView", () => {
    test("投稿とプロフィールが存在する場合、完全な投稿ビューを取得できる", async () => {
      // arrange
      const actor = actorFactory({ handle: "test.bsky.social" });
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        displayName: "Test User",
        handle: "test.bsky.social",
      });
      profileRepo.add(profile);

      const { post, record } = postFactory({
        actorDid: actor.did,
        text: "Hello World",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      postRepo.add(post);
      recordRepo.add(record);

      const postUri = new AtUri(post.uri.toString());

      // act
      const result = await postViewService.findPostView([postUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: post.uri.toString(),
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
      const actor = actorFactory({ handle: "noProfile.bsky.social" });
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        displayName: null,
        handle: "noProfile.bsky.social",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      profileRepo.add(profile);

      const { post, record } = postFactory({
        actorDid: actor.did,
        text: "Test post",
      });
      postRepo.add(post);
      recordRepo.add(record);

      const postUri = new AtUri(post.uri.toString());

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
      const actor = actorFactory({ handle: "imageuser.bsky.social" });
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        displayName: "Image User",
      });
      profileRepo.add(profile);

      const imageCid =
        "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe";

      const { post, record } = postFactory({
        actorDid: actor.did,
        text: "Post with images",
        embed: [
          new PostEmbedImage({
            cid: imageCid,
            position: 0,
            alt: "Test image",
          }),
        ],
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      const recordWithEmbed = recordFactory({
        uri: record.uri.toString(),
        cid: record.cid,
        json: {
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
        },
        indexedAt: record.indexedAt,
      });

      postRepo.add(post);
      recordRepo.add(recordWithEmbed);

      const postUri = new AtUri(post.uri.toString());

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
              thumb: `http://test-blob-proxy.example.com/images/feed_thumbnail/${actor.did}/${imageCid}.jpg`,
              fullsize: `http://test-blob-proxy.example.com/images/feed_fullsize/${actor.did}/${imageCid}.jpg`,
            },
          ],
        },
      });
    });

    test("外部リンク埋め込みを含む投稿の場合、外部リンクビューを含む投稿ビューを取得できる", async () => {
      // arrange
      const actor = actorFactory({ handle: "linkuser.bsky.social" });
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        displayName: "Link User",
      });
      profileRepo.add(profile);

      const thumbCid =
        "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe";

      const { post, record } = postFactory({
        actorDid: actor.did,
        text: "Post with external link",
        embed: new PostEmbedExternal(
          "https://example.com",
          "Example Site",
          "An example website",
          thumbCid,
        ),
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      const recordWithEmbed = recordFactory({
        uri: record.uri.toString(),
        cid: record.cid,
        json: {
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
        },
        indexedAt: record.indexedAt,
      });

      postRepo.add(post);
      recordRepo.add(recordWithEmbed);

      const postUri = new AtUri(post.uri.toString());

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
            thumb: `http://test-blob-proxy.example.com/images/feed_thumbnail/${actor.did}/${thumbCid}.jpg`,
          },
        },
      });
    });

    test("複数のURIを指定した場合、対応する複数の投稿ビューを取得できる", async () => {
      // arrange
      const actor1 = actorFactory({ handle: "user1.bsky.social" });
      const profile1 = profileDetailedFactory({
        actorDid: actor1.did,
        displayName: "User 1",
      });
      profileRepo.add(profile1);

      const actor2 = actorFactory({ handle: "user2.bsky.social" });
      const profile2 = profileDetailedFactory({
        actorDid: actor2.did,
        displayName: "User 2",
      });
      profileRepo.add(profile2);

      const { post: post1, record: record1 } = postFactory({
        actorDid: actor1.did,
        text: "First post",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      postRepo.add(post1);
      recordRepo.add(record1);

      const { post: post2, record: record2 } = postFactory({
        actorDid: actor2.did,
        text: "Second post",
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
      });
      postRepo.add(post2);
      recordRepo.add(record2);

      const postUri1 = new AtUri(post1.uri.toString());
      const postUri2 = new AtUri(post2.uri.toString());

      // act
      const result = await postViewService.findPostView([postUri1, postUri2]);

      // assert
      expect(result).toHaveLength(2);
      expect(result.map((post) => post.uri)).toEqual([
        post1.uri.toString(),
        post2.uri.toString(),
      ]);
    });

    test("存在しない投稿URIが含まれている場合、そのURIは結果に含まれない", async () => {
      // arrange
      const actor = actorFactory({ handle: "exists.bsky.social" });
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        displayName: "Existing User",
      });
      profileRepo.add(profile);

      const { post, record } = postFactory({
        actorDid: actor.did,
        text: "Existing post",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      postRepo.add(post);
      recordRepo.add(record);

      const existingUri = new AtUri(post.uri.toString());
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
        uri: post.uri.toString(),
      });
    });

    test("投稿の埋め込み(app.bsky.embed.record)を含む投稿の場合、埋め込み投稿ビューを含む投稿ビューを取得できる", async () => {
      // arrange
      const embeddedAuthor = actorFactory({ handle: "embedded.bsky.social" });
      const embeddedProfile = profileDetailedFactory({
        actorDid: embeddedAuthor.did,
        handle: embeddedAuthor.handle,
        displayName: "Embedded Author",
      });
      profileRepo.add(embeddedProfile);

      const { post: embeddedPost, record: embeddedRecord } = postFactory({
        actorDid: embeddedAuthor.did,
        text: "This is the embedded post",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      postRepo.add(embeddedPost);
      recordRepo.add(embeddedRecord);

      const quotingAuthor = actorFactory({ handle: "quoting.bsky.social" });
      const quotingProfile = profileDetailedFactory({
        actorDid: quotingAuthor.did,
        handle: quotingAuthor.handle,
        displayName: "Quoting Author",
      });
      profileRepo.add(quotingProfile);

      const { post: quotingPost, record: quotingRecord } = postFactory({
        actorDid: quotingAuthor.did,
        text: "Check out this post!",
        embed: new PostEmbedRecord({
          uri: embeddedPost.uri,
          cid: embeddedPost.cid,
        }),
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
        indexedAt: new Date("2024-01-01T01:00:00.000Z"),
      });

      const quotingRecordWithEmbed = recordFactory({
        uri: quotingRecord.uri.toString(),
        cid: quotingRecord.cid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Check out this post!",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: embeddedPost.uri.toString(),
              cid: embeddedPost.cid,
            },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        indexedAt: quotingRecord.indexedAt,
      });

      postRepo.add(quotingPost);
      recordRepo.add(quotingRecordWithEmbed);

      const quotingPostUri = new AtUri(quotingPost.uri.toString());

      // act
      const result = await postViewService.findPostView([quotingPostUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: quotingPost.uri.toString(),
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
              uri: embeddedPost.uri.toString(),
              cid: embeddedPost.cid,
            },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        embed: {
          $type: "app.bsky.embed.record#view",
          record: {
            $type: "app.bsky.embed.record#viewRecord",
            uri: embeddedPost.uri.toString(),
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
      const quotingAuthor = actorFactory({ handle: "quoting.bsky.social" });
      const quotingProfile = profileDetailedFactory({
        actorDid: quotingAuthor.did,
        displayName: "Quoting Author",
      });
      profileRepo.add(quotingProfile);

      const notFoundUri = AtUri.make(
        "did:plc:notfound",
        "app.bsky.feed.post",
        "notfound123",
      ).toString();

      const { post: quotingPost, record: quotingRecord } = postFactory({
        actorDid: quotingAuthor.did,
        text: "Quoting a deleted post",
        embed: new PostEmbedRecord({
          uri: notFoundUri,
          cid: "bafyreighost123456789",
        }),
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
      });

      const quotingRecordWithEmbed = recordFactory({
        uri: quotingRecord.uri.toString(),
        cid: quotingRecord.cid,
        json: {
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
        },
        indexedAt: quotingRecord.indexedAt,
      });

      postRepo.add(quotingPost);
      recordRepo.add(quotingRecordWithEmbed);

      const quotingPostUri = new AtUri(quotingPost.uri.toString());

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
      const generatorActor = actorFactory({ handle: "generator.bsky.social" });
      const generatorProfile = profileDetailedFactory({
        actorDid: generatorActor.did,
        handle: generatorActor.handle,
        displayName: "Generator Creator",
      });
      profileRepo.add(generatorProfile);

      const generator = generatorFactory({
        actorDid: generatorActor.did,
        did: generatorActor.did,
        displayName: "My Cool Feed",
        description: "A custom algorithmic feed",
        avatarCid: "bafyreiavatarcid123",
      });
      generatorRepo.add(generator);

      const quotingAuthor = actorFactory({ handle: "quoting.bsky.social" });
      const quotingProfile = profileDetailedFactory({
        actorDid: quotingAuthor.did,
        handle: quotingAuthor.handle,
        displayName: "Quoting Author",
      });
      profileRepo.add(quotingProfile);

      const { post: quotingPost, record: quotingRecord } = postFactory({
        actorDid: quotingAuthor.did,
        text: "Check out this feed!",
        embed: new PostEmbedRecord({
          uri: generator.uri,
          cid: generator.cid,
        }),
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
        indexedAt: new Date("2024-01-01T01:00:00.000Z"),
      });

      const quotingRecordWithEmbed = recordFactory({
        uri: quotingRecord.uri.toString(),
        cid: quotingRecord.cid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Check out this feed!",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: generator.uri.toString(),
              cid: generator.cid,
            },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        indexedAt: quotingRecord.indexedAt,
      });

      postRepo.add(quotingPost);
      recordRepo.add(quotingRecordWithEmbed);

      const quotingPostUri = new AtUri(quotingPost.uri.toString());

      // act
      const result = await postViewService.findPostView([quotingPostUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: quotingPost.uri.toString(),
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
              uri: generator.uri.toString(),
              cid: generator.cid,
            },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        embed: {
          $type: "app.bsky.embed.record#view",
          record: {
            $type: "app.bsky.feed.defs#generatorView",
            uri: generator.uri.toString(),
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
            avatar: `http://test-blob-proxy.example.com/images/avatar_thumbnail/${generatorActor.did}/bafyreiavatarcid123.jpg`,
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
      const quotingAuthor = actorFactory({ handle: "quoting.bsky.social" });
      const quotingProfile = profileDetailedFactory({
        actorDid: quotingAuthor.did,
        displayName: "Quoting Author",
      });
      profileRepo.add(quotingProfile);

      const notFoundGeneratorUri = AtUri.make(
        "did:plc:notfound",
        "app.bsky.feed.generator",
        "notfound123",
      ).toString();

      const { post: quotingPost, record: quotingRecord } = postFactory({
        actorDid: quotingAuthor.did,
        text: "Quoting a deleted generator",
        embed: new PostEmbedRecord({
          uri: notFoundGeneratorUri,
          cid: "bafyreighost123456789",
        }),
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
      });

      const quotingRecordWithEmbed = recordFactory({
        uri: quotingRecord.uri.toString(),
        cid: quotingRecord.cid,
        json: {
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
        },
        indexedAt: quotingRecord.indexedAt,
      });

      postRepo.add(quotingPost);
      recordRepo.add(quotingRecordWithEmbed);

      const quotingPostUri = new AtUri(quotingPost.uri.toString());

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
      const embeddedAuthor = actorFactory({ handle: "embedded.bsky.social" });
      const embeddedProfile = profileDetailedFactory({
        actorDid: embeddedAuthor.did,
        handle: embeddedAuthor.handle,
        displayName: "Embedded Author",
      });
      profileRepo.add(embeddedProfile);

      const { post: embeddedPost, record: embeddedRecord } = postFactory({
        actorDid: embeddedAuthor.did,
        text: "This is the embedded post",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      postRepo.add(embeddedPost);
      recordRepo.add(embeddedRecord);

      const mainAuthor = actorFactory({ handle: "main.bsky.social" });
      const mainProfile = profileDetailedFactory({
        actorDid: mainAuthor.did,
        handle: mainAuthor.handle,
        displayName: "Main Author",
      });
      profileRepo.add(mainProfile);

      const imageCid1 =
        "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe";
      const imageCid2 =
        "bafyreihg3cyqnx3cekbrrqxifcrphjkemcblsp5p4gey5ytnvqegeconoq";

      const { post: mainPost, record: mainRecord } = postFactory({
        actorDid: mainAuthor.did,
        text: "Post with both images and quoted post",
        embed: new PostEmbedRecordWithMedia({
          uri: embeddedPost.uri,
          cid: embeddedPost.cid,
          media: [
            new PostEmbedImage({
              cid: imageCid1,
              position: 0,
              alt: "First image",
            }),
            new PostEmbedImage({
              cid: imageCid2,
              position: 1,
              alt: "Second image",
            }),
          ],
        }),
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
        indexedAt: new Date("2024-01-01T01:00:00.000Z"),
      });

      const mainRecordWithEmbed = recordFactory({
        uri: mainRecord.uri.toString(),
        cid: mainRecord.cid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Post with both images and quoted post",
          embed: {
            $type: "app.bsky.embed.recordWithMedia",
            record: {
              record: {
                uri: embeddedPost.uri.toString(),
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
        indexedAt: mainRecord.indexedAt,
      });

      postRepo.add(mainPost);
      recordRepo.add(mainRecordWithEmbed);

      const mainPostUri = new AtUri(mainPost.uri.toString());

      // act
      const result = await postViewService.findPostView([mainPostUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: mainPost.uri.toString(),
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
                uri: embeddedPost.uri.toString(),
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
              uri: embeddedPost.uri.toString(),
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
                thumb: `http://test-blob-proxy.example.com/images/feed_thumbnail/${mainAuthor.did}/${imageCid1}.jpg`,
                fullsize: `http://test-blob-proxy.example.com/images/feed_fullsize/${mainAuthor.did}/${imageCid1}.jpg`,
              },
              {
                alt: "Second image",
                thumb: `http://test-blob-proxy.example.com/images/feed_thumbnail/${mainAuthor.did}/${imageCid2}.jpg`,
                fullsize: `http://test-blob-proxy.example.com/images/feed_fullsize/${mainAuthor.did}/${imageCid2}.jpg`,
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
      const authorC = actorFactory({ handle: "authorc.bsky.social" });
      const profileC = profileDetailedFactory({
        actorDid: authorC.did,
        displayName: "Author C",
      });
      profileRepo.add(profileC);

      const { post: postC, record: recordC } = postFactory({
        actorDid: authorC.did,
        text: "Original post C",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      postRepo.add(postC);
      recordRepo.add(recordC);

      const authorB = actorFactory({ handle: "authorb.bsky.social" });
      const profileB = profileDetailedFactory({
        actorDid: authorB.did,
        displayName: "Author B",
      });
      profileRepo.add(profileB);

      const { post: postB, record: recordB } = postFactory({
        actorDid: authorB.did,
        text: "Quoting post C",
        embed: new PostEmbedRecord({
          uri: postC.uri,
          cid: postC.cid,
        }),
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
        indexedAt: new Date("2024-01-01T01:00:00.000Z"),
      });

      const recordBWithEmbed = recordFactory({
        uri: recordB.uri.toString(),
        cid: recordB.cid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Quoting post C",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: postC.uri.toString(),
              cid: postC.cid,
            },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        indexedAt: recordB.indexedAt,
      });

      postRepo.add(postB);
      recordRepo.add(recordBWithEmbed);

      const authorA = actorFactory({ handle: "authora.bsky.social" });
      const profileA = profileDetailedFactory({
        actorDid: authorA.did,
        displayName: "Author A",
      });
      profileRepo.add(profileA);

      const { post: postA, record: recordA } = postFactory({
        actorDid: authorA.did,
        text: "Quoting post B",
        embed: new PostEmbedRecord({
          uri: postB.uri,
          cid: postB.cid,
        }),
        createdAt: new Date("2024-01-01T02:00:00.000Z"),
        indexedAt: new Date("2024-01-01T02:00:00.000Z"),
      });

      const recordAWithEmbed = recordFactory({
        uri: recordA.uri.toString(),
        cid: recordA.cid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Quoting post B",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: postB.uri.toString(),
              cid: postB.cid,
            },
          },
          createdAt: "2024-01-01T02:00:00.000Z",
        },
        indexedAt: recordA.indexedAt,
      });

      postRepo.add(postA);
      recordRepo.add(recordAWithEmbed);

      const postAUri = new AtUri(postA.uri.toString());

      // act
      const result = await postViewService.findPostView([postAUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: postA.uri.toString(),
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
            uri: postB.uri.toString(),
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
                  uri: postC.uri.toString(),
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
      const authorD = actorFactory({ handle: "authord.bsky.social" });
      const profileD = profileDetailedFactory({
        actorDid: authorD.did,
        displayName: "Author D",
      });
      profileRepo.add(profileD);

      const { post: postD, record: recordD } = postFactory({
        actorDid: authorD.did,
        text: "Original post D",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      postRepo.add(postD);
      recordRepo.add(recordD);

      const authorC = actorFactory({ handle: "authorc.bsky.social" });
      const profileC = profileDetailedFactory({
        actorDid: authorC.did,
        displayName: "Author C",
      });
      profileRepo.add(profileC);

      const { post: postC, record: recordC } = postFactory({
        actorDid: authorC.did,
        text: "Quoting post D",
        embed: new PostEmbedRecord({
          uri: postD.uri,
          cid: postD.cid,
        }),
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
        indexedAt: new Date("2024-01-01T01:00:00.000Z"),
      });

      const recordCWithEmbed = recordFactory({
        uri: recordC.uri.toString(),
        cid: recordC.cid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Quoting post D",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: postD.uri.toString(),
              cid: postD.cid,
            },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        indexedAt: recordC.indexedAt,
      });

      postRepo.add(postC);
      recordRepo.add(recordCWithEmbed);

      const authorB = actorFactory({ handle: "authorb.bsky.social" });
      const profileB = profileDetailedFactory({
        actorDid: authorB.did,
        displayName: "Author B",
      });
      profileRepo.add(profileB);

      const { post: postB, record: recordB } = postFactory({
        actorDid: authorB.did,
        text: "Quoting post C",
        embed: new PostEmbedRecord({
          uri: postC.uri,
          cid: postC.cid,
        }),
        createdAt: new Date("2024-01-01T02:00:00.000Z"),
        indexedAt: new Date("2024-01-01T02:00:00.000Z"),
      });

      const recordBWithEmbed = recordFactory({
        uri: recordB.uri.toString(),
        cid: recordB.cid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Quoting post C",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: postC.uri.toString(),
              cid: postC.cid,
            },
          },
          createdAt: "2024-01-01T02:00:00.000Z",
        },
        indexedAt: recordB.indexedAt,
      });

      postRepo.add(postB);
      recordRepo.add(recordBWithEmbed);

      const authorA = actorFactory({ handle: "authora.bsky.social" });
      const profileA = profileDetailedFactory({
        actorDid: authorA.did,
        displayName: "Author A",
      });
      profileRepo.add(profileA);

      const { post: postA, record: recordA } = postFactory({
        actorDid: authorA.did,
        text: "Quoting post B",
        embed: new PostEmbedRecord({
          uri: postB.uri,
          cid: postB.cid,
        }),
        createdAt: new Date("2024-01-01T03:00:00.000Z"),
        indexedAt: new Date("2024-01-01T03:00:00.000Z"),
      });

      const recordAWithEmbed = recordFactory({
        uri: recordA.uri.toString(),
        cid: recordA.cid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Quoting post B",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: postB.uri.toString(),
              cid: postB.cid,
            },
          },
          createdAt: "2024-01-01T03:00:00.000Z",
        },
        indexedAt: recordA.indexedAt,
      });

      postRepo.add(postA);
      recordRepo.add(recordAWithEmbed);

      const postAUri = new AtUri(postA.uri.toString());

      // act
      const result = await postViewService.findPostView([postAUri]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        $type: "app.bsky.feed.defs#postView",
        uri: postA.uri.toString(),
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
            uri: postB.uri.toString(),
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
                  uri: postC.uri.toString(),
                  author: {
                    displayName: "Author C",
                  },
                  value: {
                    text: "Quoting post D",
                  },
                },
              },
            ],
          },
        },
      });
    });

    test("閲覧者が投稿をいいねとリポストしている場合、viewerにそれぞれのURIが含まれる", async () => {
      // arrange
      const viewer = actorFactory();
      const viewerProfile = profileDetailedFactory({
        actorDid: viewer.did,
        displayName: "Viewer",
      });
      profileRepo.add(viewerProfile);

      const author1 = actorFactory();
      const profile1 = profileDetailedFactory({
        actorDid: author1.did,
        displayName: "Author 1",
      });
      profileRepo.add(profile1);

      const author2 = actorFactory();
      const profile2 = profileDetailedFactory({
        actorDid: author2.did,
        displayName: "Author 2",
      });
      profileRepo.add(profile2);

      const { post: post1, record: record1 } = postFactory({
        actorDid: author1.did,
        text: "Post 1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      postRepo.add(post1);
      recordRepo.add(record1);

      const like1 = likeFactory({
        actorDid: viewer.did,
        subjectUri: post1.uri.toString(),
        subjectCid: post1.cid,
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
      });
      likeRepo.add(like1);

      const { post: post2, record: record2 } = postFactory({
        actorDid: author2.did,
        text: "Post 2",
        createdAt: new Date("2024-01-01T02:00:00.000Z"),
      });
      postRepo.add(post2);
      recordRepo.add(record2);

      const repost2 = repostFactory({
        actorDid: viewer.did,
        subjectUri: post2.uri.toString(),
        subjectCid: post2.cid,
        createdAt: new Date("2024-01-01T03:00:00.000Z"),
      });
      repostRepo.add(repost2);

      const postUri1 = new AtUri(post1.uri.toString());
      const postUri2 = new AtUri(post2.uri.toString());

      // act
      const result = await postViewService.findPostView(
        [postUri1, postUri2],
        asDid(viewer.did),
      );

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        uri: post1.uri.toString(),
        viewer: {
          like: like1.uri.toString(),
          repost: undefined,
        },
      });
      expect(result[1]).toMatchObject({
        uri: post2.uri.toString(),
        viewer: {
          repost: repost2.uri.toString(),
          like: undefined,
        },
      });
    });
  });
});
