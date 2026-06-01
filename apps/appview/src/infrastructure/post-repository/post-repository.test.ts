import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { PostRepository } from "./post-repository.js";

describe("PostRepository", () => {
  const { testInjector, ctx } = testSetup;

  const postRepository = testInjector.injectClass(PostRepository);

  describe("findByUri", () => {
    test("投稿が存在しない場合、nullを返す", async () => {
      // arrange
      const uri = new AtUri("at://did:plc:xxx/app.bsky.feed.post/xxx");

      // act
      const result = await postRepository.findByUri(uri);

      // assert
      expect(result).toBeNull();
    });

    test("投稿が存在する場合、投稿を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      // act
      const result = await postRepository.findByUri(new AtUri(post.uri));

      // assert
      expect(result).toMatchObject({
        uri: new AtUri(post.uri),
        cid: post.cid,
        actorDid: post.actorDid,
        text: post.text,
      });
    });
  });

  describe("findByUris", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await postRepository.findByUris([]);

      // assert
      expect(result).toEqual([]);
    });

    test("投稿が存在しない場合、空の配列を返す", async () => {
      // arrange
      const uri = new AtUri("at://did:plc:xxx/app.bsky.feed.post/xxx");

      // act
      const result = await postRepository.findByUris([uri]);

      // assert
      expect(result).toEqual([]);
    });

    test("複数の投稿が指定された場合、それぞれの投稿を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => record1 })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => record2 })
        .create();

      // act
      const result = await postRepository.findByUris([
        new AtUri(post1.uri),
        new AtUri(post2.uri),
      ]);

      // assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ uri: new AtUri(post1.uri) }),
          expect.objectContaining({ uri: new AtUri(post2.uri) }),
        ]),
      );
    });
  });

  describe("findMany", () => {
    test("投稿が存在しない場合、空の配列を返す", async () => {
      // act
      const result = await postRepository.findMany({ limit: 10 });

      // assert
      expect(result).toEqual([]);
    });

    test("投稿が存在する場合、sortAtの降順で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => record1 })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => record2 })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await postRepository.findMany({ limit: 10 });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri.toString()).toBe(post2.uri);
      expect(result[1]?.uri.toString()).toBe(post1.uri);
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
            .create(),
        ),
      );

      // act
      const result = await postRepository.findMany({ limit: 2 });

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
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      await postFactory(ctx.db)
        .vars({ record: () => record2 })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await postRepository.findMany({
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.toString()).toBe(post1.uri);
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
      const result = await postRepository.findReplies(new AtUri(post.uri));

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
      const result = await postRepository.findReplies(
        new AtUri(parentPost.uri),
      );

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri.toString()).toBe(reply2.uri);
      expect(result[1]?.uri.toString()).toBe(reply1.uri);
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
      const result = await postRepository.findReplies(
        new AtUri(parentPost.uri),
        2,
      );

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
      const result = await postRepository.findReplies(
        new AtUri(parentPost1.uri),
      );

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
      const result = await postRepository.search({
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
      const result = await postRepository.search({
        query: "hello",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.toString()).toBe(post.uri);
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
      const result = await postRepository.search({
        query: "hello",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.toString()).toBe(post.uri);
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
      const result = await postRepository.search({
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
      const result = await postRepository.search({
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
      const result = await postRepository.search({
        query: "search",
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.toString()).toBe(post1.uri);
    });

    test("検索クエリに含まれるワイルドカード文字はエスケープされる", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      await postFactory(ctx.db)
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
      const result = await postRepository.search({
        query: "100%",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.text).toBe("100% success");
    });
  });
});
