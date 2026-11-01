import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  fakeCid,
  recordFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

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
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    likeIndexer = services.likeIndexer;
    likeRepo = services.likeRepository;
    jobScheduler = services.jobScheduler;
    subscriptionRepo = services.subscriptionRepository;
    notificationRepo = services.notificationRepository;
    db = services.db;
  });

  describe("upsert", () => {
    test("いいねレコードを正しく保存する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const liker = actorFactory();
      subscriptionRepo.add(subscriptionFactory({ actorDid: liker.did }));
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
      subscriptionRepo.add(subscriptionFactory({ actorDid: liker.did }));
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

  describe("afterAction", () => {
    test("いいね追加の場合、対象投稿に対してlike集計ジョブがスケジュールされる", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const liker = actorFactory();
      subscriptionRepo.add(subscriptionFactory({ actorDid: liker.did }));
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
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(new AtUri(postUri));
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
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(new AtUri(postUri));
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
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(new AtUri(nonExistentPostUri));
    });
  });
});
