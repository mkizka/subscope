import {
  actorFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { AuthorFeedRepository } from "./author-feed-repository.js";

describe("AuthorFeedRepository", () => {
  const { testInjector, ctx } = testSetup;

  const authorFeedRepository = testInjector.injectClass(AuthorFeedRepository);

  describe("findFeedItems", () => {
    test("指定されたアクターの投稿がない場合、空の配列を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await authorFeedRepository.findFeedItems({
        actorDid: actor.did,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("指定されたアクターの投稿がある場合、フィードアイテムのリストを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();
      const feedItem = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post })
        .create();

      // act
      const result = await authorFeedRepository.findFeedItems({
        actorDid: actor.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: feedItem.uri },
        type: "post",
        actorDid: actor.did,
      });
    });

    test("複数の投稿がある場合、sortAtの降順で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => postRecord1 })
        .create();
      const feedItem1 = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post1 })
        .props({
          sortAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const postRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => postRecord2 })
        .create();
      const feedItem2 = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post2 })
        .props({
          sortAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await authorFeedRepository.findFeedItems({
        actorDid: actor.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri.href).toBe(feedItem2.uri);
      expect(result[1]?.uri.href).toBe(feedItem1.uri);
    });

    test("リポストも含めて返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ actor: () => actor })
        .create();
      const repost = await repostFactory(ctx.db)
        .vars({ record: () => repostRecord })
        .create();
      const feedItem = await repostFeedItemFactory(ctx.db)
        .vars({ repost: () => repost })
        .create();

      // act
      const result = await authorFeedRepository.findFeedItems({
        actorDid: actor.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: feedItem.uri },
        type: "repost",
        actorDid: actor.did,
      });
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      await Promise.all(
        Array.from({ length: 3 }).map(async () => {
          const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => actor })
            .create();
          const post = await postFactory(ctx.db)
            .vars({ record: () => postRecord })
            .create();
          return postFeedItemFactory(ctx.db)
            .vars({ post: () => post })
            .create();
        }),
      );

      // act
      const result = await authorFeedRepository.findFeedItems({
        actorDid: actor.did,
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のフィードアイテムを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => postRecord1 })
        .create();
      const feedItem1 = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post1 })
        .props({
          sortAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const postRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => postRecord2 })
        .create();
      await postFeedItemFactory(ctx.db)
        .vars({ post: () => post2 })
        .props({
          sortAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await authorFeedRepository.findFeedItems({
        actorDid: actor.did,
        cursor: cursorDate,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.href).toBe(feedItem1.uri);
    });

    test("異なるアクターの投稿は含まれない", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db).create();
      const actor2 = await actorFactory(ctx.db).create();

      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor2 })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();
      await postFeedItemFactory(ctx.db)
        .vars({ post: () => post })
        .create();

      // act
      const result = await authorFeedRepository.findFeedItems({
        actorDid: actor1.did,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });

  describe("findFeedItemsWithoutReplies", () => {
    test("指定されたアクターの投稿がない場合、空の配列を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await authorFeedRepository.findFeedItemsWithoutReplies({
        actorDid: actor.did,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("リプライでない投稿のみ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const rootPost = await postFactory(ctx.db)
        .vars({ record: () => rootRecord })
        .create();
      const rootFeedItem = await postFeedItemFactory(ctx.db)
        .vars({ post: () => rootPost })
        .create();

      const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const replyPost = await postFactory(ctx.db)
        .vars({ record: () => replyRecord })
        .props({
          replyParentUri: () => rootPost.uri,
          replyParentCid: () => rootPost.cid,
          replyRootUri: () => rootPost.uri,
          replyRootCid: () => rootPost.cid,
        })
        .create();
      await postFeedItemFactory(ctx.db)
        .vars({ post: () => replyPost })
        .create();

      // act
      const result = await authorFeedRepository.findFeedItemsWithoutReplies({
        actorDid: actor.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.href).toBe(rootFeedItem.uri);
    });

    test("リポストを含めて返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ actor: () => actor })
        .create();
      const repost = await repostFactory(ctx.db)
        .vars({ record: () => repostRecord })
        .create();
      const feedItem = await repostFeedItemFactory(ctx.db)
        .vars({ repost: () => repost })
        .create();

      // act
      const result = await authorFeedRepository.findFeedItemsWithoutReplies({
        actorDid: actor.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: feedItem.uri },
        type: "repost",
        actorDid: actor.did,
      });
    });

    test("複数の投稿がある場合、sortAtの降順で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => postRecord1 })
        .create();
      const feedItem1 = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post1 })
        .props({
          sortAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const postRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => postRecord2 })
        .create();
      const feedItem2 = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post2 })
        .props({
          sortAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await authorFeedRepository.findFeedItemsWithoutReplies({
        actorDid: actor.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri.href).toBe(feedItem2.uri);
      expect(result[1]?.uri.href).toBe(feedItem1.uri);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      await Promise.all(
        Array.from({ length: 3 }).map(async () => {
          const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => actor })
            .create();
          const post = await postFactory(ctx.db)
            .vars({ record: () => postRecord })
            .create();
          return postFeedItemFactory(ctx.db)
            .vars({ post: () => post })
            .create();
        }),
      );

      // act
      const result = await authorFeedRepository.findFeedItemsWithoutReplies({
        actorDid: actor.did,
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のフィードアイテムを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => postRecord1 })
        .create();
      const feedItem1 = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post1 })
        .props({
          sortAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const postRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => postRecord2 })
        .create();
      await postFeedItemFactory(ctx.db)
        .vars({ post: () => post2 })
        .props({
          sortAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await authorFeedRepository.findFeedItemsWithoutReplies({
        actorDid: actor.did,
        cursor: cursorDate,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.href).toBe(feedItem1.uri);
    });

    test("異なるアクターの投稿は含まれない", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db).create();
      const actor2 = await actorFactory(ctx.db).create();

      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor2 })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();
      await postFeedItemFactory(ctx.db)
        .vars({ post: () => post })
        .create();

      // act
      const result = await authorFeedRepository.findFeedItemsWithoutReplies({
        actorDid: actor1.did,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });
});
