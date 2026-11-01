import { AtUri } from "@atproto/syntax";
import { RecordValidationError } from "@repo/common/domain";
import {
  actorFactory,
  fakeCid,
  recordFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  afterCommit,
  testRegistry,
  type TestServices,
} from "../../../shared/test-utils.js";

describe("LikeIndexer", () => {
  let likeIndexer: TestServices["likeIndexer"];
  let likeRepo: TestServices["likeRepository"];
  let jobScheduler: TestServices["jobScheduler"];
  let subscriptionRepo: TestServices["subscriptionRepository"];
  let notificationRepo: TestServices["notificationRepository"];
  let followRepo: TestServices["followRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    likeIndexer = services.likeIndexer;
    likeRepo = services.likeRepository;
    jobScheduler = services.jobScheduler;
    subscriptionRepo = services.subscriptionRepository;
    notificationRepo = services.notificationRepository;
    followRepo = services.followRepository;
    db = services.db;
  });

  describe("upsert", () => {
    test("いいねレコードを正しく保存する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const liker = actorFactory();
      vi.spyOn(followRepo, "isFollowedByAnySubscriber").mockResolvedValue(true);
      const postUri = "at://did:plc:other/app.bsky.feed.post/123";
      const record = recordFactory({
        uri: `at://${liker.did}/app.bsky.feed.like/likerkey123`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: postUri,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await likeIndexer.upsert({
        ctx,
        record,
      });

      // assert
      const like = likeRepo.findByUri(record.uri);
      expect(like).toMatchObject({
        uri: record.uri,
        cid: record.cid,
        actorDid: liker.did,
        subjectUri: new AtUri(postUri),
      });
    });

    test.each([
      {
        name: "notify-1: 通知はサブスクライバー宛てにだけ作る",
        isSubscriber: false,
        isSelf: false,
        expected: [],
      },
      {
        name: "notify-2: 自分自身の操作では通知を作らない",
        isSubscriber: true,
        isSelf: true,
        expected: [],
      },
      {
        name: "notify-3: いいねされた投稿の作者に like の通知を作る",
        isSubscriber: true,
        isSelf: false,
        expected: [{ reason: "like" }],
      },
    ])("$name", async ({ isSubscriber, isSelf, expected }) => {
      // arrange
      const liker = actorFactory();
      const author = isSelf ? liker : actorFactory();
      vi.spyOn(followRepo, "isFollowedByAnySubscriber").mockResolvedValue(true);
      if (isSubscriber) {
        subscriptionRepo.add(subscriptionFactory({ actorDid: author.did }));
      }
      const record = recordFactory({
        uri: `at://${liker.did}/app.bsky.feed.like/likerkey`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: `at://${author.did}/app.bsky.feed.post/123`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await likeIndexer.upsert({ ctx: { db, afterCommit }, record });

      // assert
      expect(notificationRepo.findAll()).toMatchObject(expected);
    });
  });

  test.each([
    {
      name: "いいねした人だけがサブスクライバー",
      liker: true,
      author: false,
      followee: false,
      saved: false,
    },
    {
      name: "投稿の作者がサブスクライバー",
      liker: false,
      author: true,
      followee: false,
      saved: true,
    },
    {
      name: "投稿の作者がサブスクライバーのフォロイー",
      liker: false,
      author: false,
      followee: true,
      saved: true,
    },
    {
      name: "どれでもない",
      liker: false,
      author: false,
      followee: false,
      saved: false,
    },
  ])(
    "index-11: いいねは、いいねされた投稿の作者が追跡アクターのものだけ保存する($name)",
    async ({ liker, author, followee, saved }) => {
      // arrange
      const likerActor = actorFactory();
      const authorActor = actorFactory();
      if (liker) {
        subscriptionRepo.add(subscriptionFactory({ actorDid: likerActor.did }));
      }
      if (author) {
        subscriptionRepo.add(
          subscriptionFactory({ actorDid: authorActor.did }),
        );
      }
      vi.spyOn(followRepo, "isFollowedByAnySubscriber").mockResolvedValue(
        followee,
      );
      const record = recordFactory({
        uri: `at://${likerActor.did}/app.bsky.feed.like/likerkey`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: `at://${authorActor.did}/app.bsky.feed.post/123`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = likeIndexer.upsert({ ctx: { db, afterCommit }, record });

      // assert
      if (saved) {
        await result;
        expect(likeRepo.findByUri(record.uri)).not.toBeNull();
      } else {
        await expect(result).rejects.toThrow(RecordValidationError);
        expect(likeRepo.findByUri(record.uri)).toBeNull();
      }
    },
  );

  describe("afterAction", () => {
    test("いいね追加の場合、対象投稿に対してlike集計ジョブがスケジュールされる", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const liker = actorFactory();
      vi.spyOn(followRepo, "isFollowedByAnySubscriber").mockResolvedValue(true);
      const postUri = "at://did:plc:post-author/app.bsky.feed.post/postkey456";
      const record = recordFactory({
        uri: `at://${liker.did}/app.bsky.feed.like/likerkey456`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: postUri,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });
      await likeIndexer.upsert({
        ctx,
        record,
      });

      // act
      likeIndexer.afterAction({ ctx: { db, afterCommit }, record });

      // assert
      const jobs = jobScheduler.getAggregatePostStatsJobs();
      expect(jobs).toContainEqual(
        expect.objectContaining({
          uri: new AtUri(postUri),
          type: "like",
        }),
      );
    });

    test("いいね削除の場合も、対象投稿に対してlike集計ジョブがスケジュールされる", () => {
      // arrange
      const liker = actorFactory();
      const postUri = "at://did:plc:post-author/app.bsky.feed.post/postkey789";
      const record = recordFactory({
        uri: `at://${liker.did}/app.bsky.feed.like/likerkey789`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: postUri,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      likeIndexer.afterAction({ ctx: { db, afterCommit }, record });

      // assert
      const jobs = jobScheduler.getAggregatePostStatsJobs();
      expect(jobs).toContainEqual(
        expect.objectContaining({
          uri: new AtUri(postUri),
          type: "like",
        }),
      );
    });

    test("対象の投稿が存在しない場合でも集計ジョブがスケジュールされる", () => {
      // arrange
      const liker = actorFactory();
      const nonExistentPostUri =
        "at://did:plc:nonexistent/app.bsky.feed.post/999";
      const record = recordFactory({
        uri: `at://${liker.did}/app.bsky.feed.like/likerkey999`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: nonExistentPostUri,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      likeIndexer.afterAction({ ctx: { db, afterCommit }, record });

      // assert
      const jobs = jobScheduler.getAggregatePostStatsJobs();
      expect(jobs).toContainEqual(
        expect.objectContaining({
          uri: new AtUri(nonExistentPostUri),
          type: "like",
        }),
      );
    });
  });
});
