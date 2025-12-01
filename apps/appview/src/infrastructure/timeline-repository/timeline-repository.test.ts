import { asDid } from "@atproto/did";
import {
  actorFactory,
  followFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { TimelineRepository } from "./timeline-repository.js";

describe("TimelineRepository", () => {
  const { testInjector, ctx } = testSetup;

  const timelineRepository = testInjector.injectClass(TimelineRepository);

  describe("findFeedItems", () => {
    test("フォロー中のアクターがいない場合、ビューアー自身の投稿のみ返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const viewerRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => viewerActor })
        .create();
      const viewerPost = await postFactory(ctx.db)
        .vars({ record: () => viewerRecord })
        .create();
      const feedItem = await postFeedItemFactory(ctx.db)
        .vars({ post: () => viewerPost })
        .create();

      const otherActor = await actorFactory(ctx.db).create();
      const otherRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => otherActor })
        .create();
      const otherPost = await postFactory(ctx.db)
        .vars({ record: () => otherRecord })
        .create();
      await postFeedItemFactory(ctx.db)
        .vars({ post: () => otherPost })
        .create();

      // act
      const result = await timelineRepository.findFeedItems({
        viewerDid: asDid(viewerActor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: feedItem.uri },
        actorDid: viewerActor.did,
      });
    });

    test("フォロー中のアクターの投稿を返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const followedActor = await actorFactory(ctx.db).create();

      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => followRecord,
          followee: () => followedActor,
        })
        .create();

      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => followedActor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();
      const feedItem = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post })
        .create();

      // act
      const result = await timelineRepository.findFeedItems({
        viewerDid: asDid(viewerActor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: feedItem.uri },
        actorDid: followedActor.did,
      });
    });

    test("フォロー中のアクターの投稿とビューアー自身の投稿の両方を返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const followedActor = await actorFactory(ctx.db).create();

      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => followRecord,
          followee: () => followedActor,
        })
        .create();

      const viewerPostRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => viewerActor })
        .create();
      const viewerPost = await postFactory(ctx.db)
        .vars({ record: () => viewerPostRecord })
        .create();
      const viewerFeedItem = await postFeedItemFactory(ctx.db)
        .vars({ post: () => viewerPost })
        .create();

      const followedPostRecord = await recordFactory(
        ctx.db,
        "app.bsky.feed.post",
      )
        .vars({ actor: () => followedActor })
        .create();
      const followedPost = await postFactory(ctx.db)
        .vars({ record: () => followedPostRecord })
        .create();
      const followedFeedItem = await postFeedItemFactory(ctx.db)
        .vars({ post: () => followedPost })
        .create();

      // act
      const result = await timelineRepository.findFeedItems({
        viewerDid: asDid(viewerActor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.uri.href)).toContain(viewerFeedItem.uri);
      expect(result.map((r) => r.uri.href)).toContain(followedFeedItem.uri);
    });

    test("フォローしていないアクターの投稿は含まれない", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const otherActor = await actorFactory(ctx.db).create();

      const otherPostRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => otherActor })
        .create();
      const otherPost = await postFactory(ctx.db)
        .vars({ record: () => otherPostRecord })
        .create();
      await postFeedItemFactory(ctx.db)
        .vars({ post: () => otherPost })
        .create();

      // act
      const result = await timelineRepository.findFeedItems({
        viewerDid: asDid(viewerActor.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("複数のフォロー中のアクターの投稿を返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const followedActor1 = await actorFactory(ctx.db).create();
      const followedActor2 = await actorFactory(ctx.db).create();

      const followRecord1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => followRecord1,
          followee: () => followedActor1,
        })
        .create();

      const followRecord2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => followRecord2,
          followee: () => followedActor2,
        })
        .create();

      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => followedActor1 })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => postRecord1 })
        .create();
      const feedItem1 = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post1 })
        .create();

      const postRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => followedActor2 })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => postRecord2 })
        .create();
      const feedItem2 = await postFeedItemFactory(ctx.db)
        .vars({ post: () => post2 })
        .create();

      // act
      const result = await timelineRepository.findFeedItems({
        viewerDid: asDid(viewerActor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.uri.href)).toContain(feedItem1.uri);
      expect(result.map((r) => r.uri.href)).toContain(feedItem2.uri);
    });

    test("リポストも含めて返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const followedActor = await actorFactory(ctx.db).create();

      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => followRecord,
          followee: () => followedActor,
        })
        .create();

      const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ actor: () => followedActor })
        .create();
      const repost = await repostFactory(ctx.db)
        .vars({ record: () => repostRecord })
        .create();
      const feedItem = await repostFeedItemFactory(ctx.db)
        .vars({ repost: () => repost })
        .create();

      // act
      const result = await timelineRepository.findFeedItems({
        viewerDid: asDid(viewerActor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: feedItem.uri },
        type: "repost",
        actorDid: followedActor.did,
      });
    });

    test("sortAtの降順で返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const followedActor = await actorFactory(ctx.db).create();

      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => followRecord,
          followee: () => followedActor,
        })
        .create();

      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => followedActor })
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
        .vars({ actor: () => followedActor })
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
      const result = await timelineRepository.findFeedItems({
        viewerDid: asDid(viewerActor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri.href).toBe(feedItem2.uri);
      expect(result[1]?.uri.href).toBe(feedItem1.uri);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const followedActor = await actorFactory(ctx.db).create();

      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => followRecord,
          followee: () => followedActor,
        })
        .create();

      await Promise.all(
        Array.from({ length: 3 }).map(async () => {
          const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => followedActor })
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
      const result = await timelineRepository.findFeedItems({
        viewerDid: asDid(viewerActor.did),
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のフィードアイテムを返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const followedActor = await actorFactory(ctx.db).create();

      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => followRecord,
          followee: () => followedActor,
        })
        .create();

      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => followedActor })
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
        .vars({ actor: () => followedActor })
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
      const result = await timelineRepository.findFeedItems({
        viewerDid: asDid(viewerActor.did),
        cursor: cursorDate,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.href).toBe(feedItem1.uri);
    });
  });
});
