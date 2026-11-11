import { AtUri } from "@atproto/syntax";
import { fakeCid } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../../domain/account.factory.js";
import {
  afterCommit,
  testRegistry,
  type TestServices,
} from "../../../shared/test-utils.js";
import { recordFactory } from "../../dto/record.factory.js";

describe("LikeIndexer", () => {
  let likeIndexer: TestServices["likeIndexer"];
  let likeRepo: TestServices["likeRepository"];
  let jobScheduler: TestServices["jobScheduler"];
  let registrationQuery: TestServices["registrationQuery"];
  let notificationRepo: TestServices["notificationRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    likeIndexer = services.likeIndexer;
    likeRepo = services.likeRepository;
    jobScheduler = services.jobScheduler;
    registrationQuery = services.registrationQuery;
    notificationRepo = services.notificationRepository;
    db = services.db;
  });

  describe("upsert", () => {
    test("いいねレコードを正しく保存する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const liker = accountFactory();
      registrationQuery.add(liker.did);
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
      await likeIndexer.upsert({ ctx, record, live: false, depth: 0 });

      // assert
      const like = await likeRepo.find({ ctx, uri: record.uri });
      expect(like).toMatchObject({
        uri: record.uri.toString(),
        cid: record.cid,
        accountDid: liker.did,
        subjectUri: postUri,
      });
    });

    test.each([
      {
        name: "notify-1: 通知はサブスクライバー宛てにだけ作る",
        isRegistered: false,
        isSelf: false,
        expected: [],
      },
      {
        name: "notify-2: 自分自身の操作では通知を作らない",
        isRegistered: true,
        isSelf: true,
        expected: [],
      },
      {
        name: "notify-3: いいねされた投稿の作者に like の通知を作る",
        isRegistered: true,
        isSelf: false,
        expected: [{ reason: "like" }],
      },
    ])("$name", async ({ isRegistered, isSelf, expected }) => {
      // arrange
      const liker = accountFactory();
      const author = isSelf ? liker : accountFactory();
      registrationQuery.add(liker.did);
      if (isRegistered) {
        registrationQuery.add(author.did);
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
      await likeIndexer.upsert({
        ctx: { db, afterCommit },
        record,
        live: true,
        depth: 0,
      });

      // assert
      expect(notificationRepo.findAll()).toMatchObject(expected);
    });
  });

  describe("notify-9", () => {
    test.each([
      { name: "バックフィルで受け取ったレコード", live: false, depth: 0 },
      { name: "取得しに行ったレコード", live: true, depth: 1 },
    ])(
      "notify-9: 通知はTapからリアルタイムに受け取ったレコードでだけ作り、バックフィルで受け取ったレコードや取得しに行ったレコードでは作らない ($name)",
      async ({ live, depth }) => {
        // arrange
        const liker = accountFactory();
        const author = accountFactory();
        registrationQuery.add(author.did);
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
        await likeIndexer.upsert({
          ctx: { db, afterCommit },
          record,
          live,
          depth,
        });

        // assert
        expect(notificationRepo.findAll()).toEqual([]);
      },
    );
  });

  describe("afterAction", () => {
    test("いいね追加の場合、対象投稿に対してlike集計ジョブがスケジュールされる", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const liker = accountFactory();
      registrationQuery.add(liker.did);
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
      await likeIndexer.upsert({ ctx, record, live: false, depth: 0 });

      // act
      likeIndexer.afterAction({ ctx: { db, afterCommit }, record });

      // assert
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(new AtUri(postUri));
    });

    test("いいね削除の場合も、対象投稿に対してlike集計ジョブがスケジュールされる", () => {
      // arrange
      const liker = accountFactory();
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
      const liker = accountFactory();
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
