import {
  accountFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { AuthorFeedQuery } from "./author-feed-query.js";

describe("AuthorFeedQuery", () => {
  const { ctx } = testSetup;

  const authorFeedQuery = new AuthorFeedQuery(ctx.db);

  describe("findFeedItems", () => {
    test("指定されたアカウントの投稿がない場合、空の配列を返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      // act
      const result = await authorFeedQuery.findFeedItems({
        accountDid: account.did,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("指定されたアカウントの投稿がある場合、フィードアイテムのリストを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();
      const feedItem = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post })
        .create();

      // act
      const result = await authorFeedQuery.findFeedItems({
        accountDid: account.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: feedItem.uri,
        type: "post",
        accountDid: account.did,
      });
    });

    test("複数の投稿がある場合、sortAtの降順で返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
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
        .vars({ account: () => account })
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
      const result = await authorFeedQuery.findFeedItems({
        accountDid: account.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri).toBe(feedItem2.uri);
      expect(result[1]?.uri).toBe(feedItem1.uri);
    });

    test("リポストも含めて返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ account: () => account })
        .create();
      const repost = await repostFactory(ctx.db)
        .vars({ record: () => repostRecord })
        .create();
      const feedItem = await repostFeedItemFactory(ctx.db)
        .vars({ repost: () => repost })
        .create();

      // act
      const result = await authorFeedQuery.findFeedItems({
        accountDid: account.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: feedItem.uri,
        type: "repost",
        accountDid: account.did,
      });
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      await Promise.all(
        Array.from({ length: 3 }).map(async () => {
          const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => account })
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
      const result = await authorFeedQuery.findFeedItems({
        accountDid: account.did,
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のフィードアイテムを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
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
        .vars({ account: () => account })
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
      const result = await authorFeedQuery.findFeedItems({
        accountDid: account.did,
        cursor: cursorDate,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBe(feedItem1.uri);
    });

    test("異なるアカウントの投稿は含まれない", async () => {
      // arrange
      const account1 = await accountFactory(ctx.db).create();
      const account2 = await accountFactory(ctx.db).create();

      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account2 })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();
      await postFeedItemFactory(ctx.db)
        .vars({ post: () => post })
        .create();

      // act
      const result = await authorFeedQuery.findFeedItems({
        accountDid: account1.did,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });

  describe("findFeedItemsWithoutReplies", () => {
    test("指定されたアカウントの投稿がない場合、空の配列を返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      // act
      const result = await authorFeedQuery.findFeedItemsWithoutReplies({
        accountDid: account.did,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("リプライでない投稿のみ返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
        .create();
      const rootPost = await postFactory(ctx.db)
        .vars({ record: () => rootRecord })
        .create();
      const rootFeedItem = await postFeedItemFactory(ctx.db)
        .vars({ post: () => rootPost })
        .create();

      const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
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
      const result = await authorFeedQuery.findFeedItemsWithoutReplies({
        accountDid: account.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBe(rootFeedItem.uri);
    });

    test("リポストを含めて返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ account: () => account })
        .create();
      const repost = await repostFactory(ctx.db)
        .vars({ record: () => repostRecord })
        .create();
      const feedItem = await repostFeedItemFactory(ctx.db)
        .vars({ repost: () => repost })
        .create();

      // act
      const result = await authorFeedQuery.findFeedItemsWithoutReplies({
        accountDid: account.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: feedItem.uri,
        type: "repost",
        accountDid: account.did,
      });
    });

    test("複数の投稿がある場合、sortAtの降順で返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
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
        .vars({ account: () => account })
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
      const result = await authorFeedQuery.findFeedItemsWithoutReplies({
        accountDid: account.did,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri).toBe(feedItem2.uri);
      expect(result[1]?.uri).toBe(feedItem1.uri);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      await Promise.all(
        Array.from({ length: 3 }).map(async () => {
          const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => account })
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
      const result = await authorFeedQuery.findFeedItemsWithoutReplies({
        accountDid: account.did,
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のフィードアイテムを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
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
        .vars({ account: () => account })
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
      const result = await authorFeedQuery.findFeedItemsWithoutReplies({
        accountDid: account.did,
        cursor: cursorDate,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBe(feedItem1.uri);
    });

    test("異なるアカウントの投稿は含まれない", async () => {
      // arrange
      const account1 = await accountFactory(ctx.db).create();
      const account2 = await accountFactory(ctx.db).create();

      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account2 })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();
      await postFeedItemFactory(ctx.db)
        .vars({ post: () => post })
        .create();

      // act
      const result = await authorFeedQuery.findFeedItemsWithoutReplies({
        accountDid: account1.did,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });
});
