import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  postEmbedExternalFactory,
  postEmbedImageFactory,
  postEmbedRecordFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { PostQuery } from "./post-query.js";

describe("PostQuery", () => {
  const { ctx } = testSetup;

  const postQuery = new PostQuery(ctx.db);

  describe("findByUris", () => {
    test("存在しない投稿は含めない", async () => {
      // act
      const result = await postQuery.findByUris([
        new AtUri("at://did:plc:123/app.bsky.feed.post/456"),
      ]);

      // assert
      expect(result).toEqual([]);
    });

    test("埋め込みのない投稿は、埋め込みを空にして返す", async () => {
      // arrange
      const post = await postFactory(ctx.db).create();

      // act
      const result = await postQuery.findByUris([new AtUri(post.uri)]);

      // assert
      expect(result).toEqual([
        {
          uri: post.uri,
          actorDid: post.actorDid,
          embedImages: [],
          embedExternal: null,
          embedRecordUri: null,
          replyRootUri: null,
          replyParentUri: null,
          indexedAt: post.indexedAt,
          sortAt: post.sortAt,
        },
      ]);
    });

    test("埋め込みのある投稿は、画像をposition順に並べて埋め込みと一緒に返す", async () => {
      // arrange
      const post = await postFactory(ctx.db).create();
      const image1 = await postEmbedImageFactory(ctx.db)
        .vars({ post: () => post })
        .props({ position: () => 1 })
        .create();
      const image0 = await postEmbedImageFactory(ctx.db)
        .vars({ post: () => post })
        .props({ position: () => 0 })
        .create();
      const external = await postEmbedExternalFactory(ctx.db)
        .vars({ post: () => post })
        .create();
      const record = await postEmbedRecordFactory(ctx.db)
        .vars({ post: () => post })
        .create();

      // act
      const [result] = await postQuery.findByUris([new AtUri(post.uri)]);

      // assert
      expect(result).toMatchObject({
        embedImages: [image0, image1].map((image) => ({
          cid: image.cid,
          alt: image.alt,
          aspectRatio: {
            width: image.aspectRatioWidth,
            height: image.aspectRatioHeight,
          },
        })),
        embedExternal: {
          uri: external.uri,
          title: external.title,
          description: external.description,
          thumbCid: external.thumbCid,
        },
        embedRecordUri: record.uri,
      });
    });
  });

  describe("findReplies", () => {
    test("リプライが存在しない場合、空の配列を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      // act
      const result = await postQuery.findReplies(new AtUri(post.uri));

      // assert
      expect(result).toEqual([]);
    });

    test("リプライが存在する場合、sortAtの昇順で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const parentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const parentPost = await postFactory(ctx.db)
        .vars({ record: () => parentRecord })
        .create();

      const replyRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const reply1 = await postFactory(ctx.db)
        .vars({ record: () => replyRecord1 })
        .props({
          replyParentUri: () => parentPost.uri,
          replyParentCid: () => parentPost.cid,
          replyRootUri: () => parentPost.uri,
          replyRootCid: () => parentPost.cid,
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const replyRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const reply2 = await postFactory(ctx.db)
        .vars({ record: () => replyRecord2 })
        .props({
          replyParentUri: () => parentPost.uri,
          replyParentCid: () => parentPost.cid,
          replyRootUri: () => parentPost.uri,
          replyRootCid: () => parentPost.cid,
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      // act
      const result = await postQuery.findReplies(new AtUri(parentPost.uri));

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri).toBe(reply2.uri);
      expect(result[1]?.uri).toBe(reply1.uri);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const parentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const parentPost = await postFactory(ctx.db)
        .vars({ record: () => parentRecord })
        .create();

      const replyRecords = await Promise.all(
        Array.from({ length: 3 }, () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => actor })
            .create(),
        ),
      );
      await Promise.all(
        replyRecords.map((replyRecord) =>
          postFactory(ctx.db)
            .vars({ record: () => replyRecord })
            .props({
              replyParentUri: () => parentPost.uri,
              replyParentCid: () => parentPost.cid,
              replyRootUri: () => parentPost.uri,
              replyRootCid: () => parentPost.cid,
            })
            .create(),
        ),
      );

      // act
      const result = await postQuery.findReplies(new AtUri(parentPost.uri), 2);

      // assert
      expect(result).toHaveLength(2);
    });

    test("異なる投稿へのリプライは含まれない", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const parentRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const parentPost1 = await postFactory(ctx.db)
        .vars({ record: () => parentRecord1 })
        .create();

      const parentRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const parentPost2 = await postFactory(ctx.db)
        .vars({ record: () => parentRecord2 })
        .create();

      const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      await postFactory(ctx.db)
        .vars({ record: () => replyRecord })
        .props({
          replyParentUri: () => parentPost2.uri,
          replyParentCid: () => parentPost2.cid,
          replyRootUri: () => parentPost2.uri,
          replyRootCid: () => parentPost2.cid,
        })
        .create();

      // act
      const result = await postQuery.findReplies(new AtUri(parentPost1.uri));

      // assert
      expect(result).toEqual([]);
    });
  });

  describe("search", () => {
    test("検索クエリに一致する投稿がない場合、空の配列を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      await postFactory(ctx.db)
        .vars({ record: () => record })
        .props({
          text: () => "hello world",
        })
        .create();

      // act
      const result = await postQuery.search({
        query: "notfound",
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("検索クエリに一致する投稿がある場合、その投稿を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .props({
          text: () => "hello world",
        })
        .create();

      // act
      const result = await postQuery.search({
        query: "hello",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBe(post.uri);
    });

    test("検索クエリは大文字小文字を区別しない", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .props({
          text: () => "Hello World",
        })
        .create();

      // act
      const result = await postQuery.search({
        query: "hello",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBe(post.uri);
    });

    test("リプライ投稿は検索結果に含まれない", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const parentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const parentPost = await postFactory(ctx.db)
        .vars({ record: () => parentRecord })
        .create();

      const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      await postFactory(ctx.db)
        .vars({ record: () => replyRecord })
        .props({
          text: () => "search query",
          replyParentUri: () => parentPost.uri,
          replyParentCid: () => parentPost.cid,
          replyRootUri: () => parentPost.uri,
          replyRootCid: () => parentPost.cid,
        })
        .create();

      // act
      const result = await postQuery.search({
        query: "search",
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const records = await Promise.all(
        Array.from({ length: 3 }, () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => actor })
            .create(),
        ),
      );
      await Promise.all(
        records.map((record) =>
          postFactory(ctx.db)
            .vars({ record: () => record })
            .props({
              text: () => "search query",
            })
            .create(),
        ),
      );

      // act
      const result = await postQuery.search({
        query: "search",
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前の投稿を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => record1 })
        .props({
          text: () => "search query",
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      await postFactory(ctx.db)
        .vars({ record: () => record2 })
        .props({
          text: () => "search query",
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await postQuery.search({
        query: "search",
        limit: 10,
        cursor: cursorDate,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBe(post1.uri);
    });

    test("検索クエリに含まれるワイルドカード文字はエスケープされる", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record1 })
        .props({
          text: () => "100% success",
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      await postFactory(ctx.db)
        .vars({ record: () => record2 })
        .props({
          text: () => "200% success",
        })
        .create();

      // act
      const result = await postQuery.search({
        query: "100%",
        limit: 10,
      });

      // assert
      expect(result).toEqual([expect.objectContaining({ uri: post.uri })]);
    });
  });
});
