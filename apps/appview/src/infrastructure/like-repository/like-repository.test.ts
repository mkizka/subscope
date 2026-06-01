import { asDid } from "@atproto/did";
import {
  actorFactory,
  likeFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { LikeRepository } from "./like-repository.js";

describe("LikeRepository", () => {
  const { testInjector, ctx } = testSetup;

  const likeRepository = testInjector.injectClass(LikeRepository);

  describe("findMany", () => {
    test("指定された投稿へのいいねがない場合、空の配列を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      // act
      const result = await likeRepository.findMany({
        subjectUri: post.uri,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("指定された投稿へのいいねがある場合、いいねのリストを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      const likeActor = await actorFactory(ctx.db).create();
      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => likeActor })
        .create();
      const like = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord,
          subject: () => post,
        })
        .create();

      // act
      const result = await likeRepository.findMany({
        subjectUri: post.uri,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: like.uri },
        cid: like.cid,
        actorDid: like.actorDid,
        subjectUri: { href: post.uri },
        subjectCid: like.subjectCid,
        createdAt: like.createdAt,
      });
    });

    test("複数のいいねがある場合、sortAtの降順で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      const likeActor1 = await actorFactory(ctx.db).create();
      const likeRecord1 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => likeActor1 })
        .create();
      const like1 = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord1,
          subject: () => post,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const likeActor2 = await actorFactory(ctx.db).create();
      const likeRecord2 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => likeActor2 })
        .create();
      const like2 = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord2,
          subject: () => post,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await likeRepository.findMany({
        subjectUri: post.uri,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri.href).toBe(like2.uri);
      expect(result[1]?.uri.href).toBe(like1.uri);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      const likeActors = await actorFactory(ctx.db).createList(3);
      const likeRecords = await Promise.all(
        likeActors.map((likeActor) =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => likeActor })
            .create(),
        ),
      );
      await Promise.all(
        likeRecords.map((likeRecord) =>
          likeFactory(ctx.db)
            .vars({
              record: () => likeRecord,
              subject: () => post,
            })
            .create(),
        ),
      );

      // act
      const result = await likeRepository.findMany({
        subjectUri: post.uri,
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のいいねを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      const likeActor1 = await actorFactory(ctx.db).create();
      const likeRecord1 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => likeActor1 })
        .create();
      const like1 = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord1,
          subject: () => post,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const likeActor2 = await actorFactory(ctx.db).create();
      const likeRecord2 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => likeActor2 })
        .create();
      await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord2,
          subject: () => post,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await likeRepository.findMany({
        subjectUri: post.uri,
        limit: 10,
        cursor: cursorDate,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.href).toBe(like1.uri);
    });

    test("異なる投稿へのいいねは含まれない", async () => {
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

      const likeActor = await actorFactory(ctx.db).create();
      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => likeActor })
        .create();
      await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord,
          subject: () => post2,
        })
        .create();

      // act
      const result = await likeRepository.findMany({
        subjectUri: post1.uri,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });

  describe("findLikesByActor", () => {
    test("指定されたアクターのいいねがない場合、空の配列を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await likeRepository.findLikesByActor({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("指定されたアクターのいいねがある場合、いいねのリストを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postActor = await actorFactory(ctx.db).create();
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();

      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => actor })
        .create();
      const like = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord,
          subject: () => post,
        })
        .create();

      // act
      const result = await likeRepository.findLikesByActor({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: like.uri },
        cid: like.cid,
        actorDid: actor.did,
        subjectUri: { href: post.uri },
        subjectCid: like.subjectCid,
        createdAt: like.createdAt,
      });
    });

    test("複数のいいねがある場合、sortAtの降順で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postActor = await actorFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => postRecord1 })
        .create();

      const postRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => postRecord2 })
        .create();

      const likeRecord1 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => actor })
        .create();
      const like1 = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord1,
          subject: () => post1,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const likeRecord2 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => actor })
        .create();
      const like2 = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord2,
          subject: () => post2,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await likeRepository.findLikesByActor({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri.href).toBe(like2.uri);
      expect(result[1]?.uri.href).toBe(like1.uri);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postActor = await actorFactory(ctx.db).create();

      const posts = await Promise.all(
        Array.from({ length: 3 }).map(async () => {
          const record = await recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => postActor })
            .create();
          return postFactory(ctx.db)
            .vars({ record: () => record })
            .create();
        }),
      );

      await Promise.all(
        posts.map(async (post) => {
          const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .create();
          return likeFactory(ctx.db)
            .vars({
              record: () => likeRecord,
              subject: () => post,
            })
            .create();
        }),
      );

      // act
      const result = await likeRepository.findLikesByActor({
        actorDid: asDid(actor.did),
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のいいねを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postActor = await actorFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => postRecord1 })
        .create();

      const postRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => postRecord2 })
        .create();

      const likeRecord1 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => actor })
        .create();
      const like1 = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord1,
          subject: () => post1,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const likeRecord2 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => actor })
        .create();
      await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord2,
          subject: () => post2,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await likeRepository.findLikesByActor({
        actorDid: asDid(actor.did),
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.href).toBe(like1.uri);
    });

    test("異なるアクターのいいねは含まれない", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db).create();
      const actor2 = await actorFactory(ctx.db).create();
      const postActor = await actorFactory(ctx.db).create();
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();

      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => actor2 })
        .create();
      await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord,
          subject: () => post,
        })
        .create();

      // act
      const result = await likeRepository.findLikesByActor({
        actorDid: asDid(actor1.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });

  describe("findViewerLikes", () => {
    test("指定されたビューアーのいいねがない場合、空の配列を返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const postActor = await actorFactory(ctx.db).create();
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();

      // act
      const result = await likeRepository.findViewerLikes({
        viewerDid: asDid(viewerActor.did),
        subjectUris: [post.uri],
      });

      // assert
      expect(result).toEqual([]);
    });

    test("指定されたビューアーのいいねがある場合、いいねのリストを返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const postActor = await actorFactory(ctx.db).create();
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();

      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => viewerActor })
        .create();
      const like = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord,
          subject: () => post,
        })
        .create();

      // act
      const result = await likeRepository.findViewerLikes({
        viewerDid: asDid(viewerActor.did),
        subjectUris: [post.uri],
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: { href: like.uri },
        cid: like.cid,
        actorDid: viewerActor.did,
        subjectUri: { href: post.uri },
        subjectCid: like.subjectCid,
        createdAt: like.createdAt,
      });
    });

    test("複数の投稿へのいいねがある場合、すべて返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const postActor = await actorFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => postRecord1 })
        .create();

      const postRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => postRecord2 })
        .create();

      const likeRecord1 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => viewerActor })
        .create();
      const like1 = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord1,
          subject: () => post1,
        })
        .create();

      const likeRecord2 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => viewerActor })
        .create();
      const like2 = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord2,
          subject: () => post2,
        })
        .create();

      // act
      const result = await likeRepository.findViewerLikes({
        viewerDid: asDid(viewerActor.did),
        subjectUris: [post1.uri, post2.uri],
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.uri.href)).toContain(like1.uri);
      expect(result.map((r) => r.uri.href)).toContain(like2.uri);
    });

    test("指定された投稿のみのいいねを返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const postActor = await actorFactory(ctx.db).create();
      const postRecord1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => postRecord1 })
        .create();

      const postRecord2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => postRecord2 })
        .create();

      const likeRecord1 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => viewerActor })
        .create();
      const like1 = await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord1,
          subject: () => post1,
        })
        .create();

      const likeRecord2 = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => viewerActor })
        .create();
      await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord2,
          subject: () => post2,
        })
        .create();

      // act
      const result = await likeRepository.findViewerLikes({
        viewerDid: asDid(viewerActor.did),
        subjectUris: [post1.uri],
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri.href).toBe(like1.uri);
    });

    test("異なるアクターのいいねは含まれない", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const otherActor = await actorFactory(ctx.db).create();
      const postActor = await actorFactory(ctx.db).create();
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => postActor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();

      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => otherActor })
        .create();
      await likeFactory(ctx.db)
        .vars({
          record: () => likeRecord,
          subject: () => post,
        })
        .create();

      // act
      const result = await likeRepository.findViewerLikes({
        viewerDid: asDid(viewerActor.did),
        subjectUris: [post.uri],
      });

      // assert
      expect(result).toEqual([]);
    });
  });
});
