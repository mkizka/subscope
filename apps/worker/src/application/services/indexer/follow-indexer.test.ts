import {
  actorFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("FollowIndexer", () => {
  let followIndexer: TestServices["followIndexer"];
  let followRepo: TestServices["followRepository"];
  let jobScheduler: TestServices["jobScheduler"];
  let subscriptionRepo: TestServices["subscriptionRepository"];
  let notificationRepo: TestServices["notificationRepository"];
  let db: TestServices["db"];
  let ctx: { db: TestServices["db"] };
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    followIndexer = services.followIndexer;
    followRepo = services.followRepository;
    jobScheduler = services.jobScheduler;
    subscriptionRepo = services.subscriptionRepository;
    notificationRepo = services.notificationRepository;
    db = services.db;
    ctx = { db };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("upsert", () => {
    test("フォローレコードを正しく保存する", async () => {
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/followrkey123`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await followIndexer.upsert({
        ctx,
        record,
        live: false,
      });

      // assert
      const follow = followRepo.findByUri(record.uri);
      expect(follow).toMatchObject({
        uri: record.uri,
        cid: record.cid,
        actorDid: follower.did,
        subjectDid: followee.did,
      });
    });

    test("syncTapRepo-4: フォロワーがサブスクライバーの場合、フォロイーのsyncTapRepoジョブを積む", async () => {
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      const subscription = subscriptionFactory({ actorDid: follower.did });
      subscriptionRepo.add(subscription);

      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/followrkey456`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await followIndexer.upsert({
        ctx,
        record,
        live: false,
      });

      // assert
      const syncTapRepoJobs = jobScheduler.getSyncTapRepoJobs();
      expect(syncTapRepoJobs).toContainEqual(
        expect.objectContaining({ did: followee.did }),
      );
    });

    test("フォロワーがサブスクライバーでない場合、syncTapRepoジョブを積まない", async () => {
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/followrkey789`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await followIndexer.upsert({
        ctx,
        record,
        live: false,
      });

      // assert
      const syncTapRepoJobs = jobScheduler.getSyncTapRepoJobs();
      expect(syncTapRepoJobs).not.toContainEqual(
        expect.objectContaining({ did: followee.did }),
      );
    });

    test("フォロイーがサブスクライバーなら通知を作成する", async () => {
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      subscriptionRepo.add(subscriptionFactory({ actorDid: followee.did }));
      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/followrkey`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await followIndexer.upsert({ ctx, record, live: false });

      // assert
      expect(notificationRepo.findAll()).toMatchObject([
        {
          recordUri: record.uri.toString(),
          recipientDid: followee.did,
          authorDid: follower.did,
          reason: "follow",
          reasonSubject: null,
        },
      ]);
    });
  });

  describe("afterAction", () => {
    test("フォロー作成時にfollows/followers集計ジョブがスケジュールされる", async () => {
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/followrkey789`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });
      await followIndexer.upsert({
        ctx,
        record,
        live: false,
      });

      // act
      await followIndexer.afterAction({ ctx, record, action: "upsert" });

      // assert
      const jobs = jobScheduler.getAggregateActorStatsJobs();
      expect(jobs).toContainEqual(
        expect.objectContaining({
          did: follower.did,
          type: "follows",
        }),
      );
      expect(jobs).toContainEqual(
        expect.objectContaining({
          did: followee.did,
          type: "followers",
        }),
      );
    });

    test("syncTapRepo-5: フォロワーがサブスクライバーのフォローが削除された場合、フォロイーのsyncTapRepoジョブを積む", async () => {
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      const subscription = subscriptionFactory({ actorDid: follower.did });
      subscriptionRepo.add(subscription);

      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/followrkey_delete1`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });
      await followIndexer.upsert({
        ctx,
        record,
        live: false,
      });
      followRepo.deleteByUri(record.uri);

      // act
      await followIndexer.afterAction({ ctx, record, action: "delete" });

      // assert
      const syncTapRepoJobs = jobScheduler.getSyncTapRepoJobs();
      expect(syncTapRepoJobs).toContainEqual(
        expect.objectContaining({ did: followee.did }),
      );
    });

    test("フォロワーがサブスクライバーでないフォローが削除された場合、syncTapRepoジョブを積まない", async () => {
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/followrkey_delete2`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await followIndexer.afterAction({ ctx, record, action: "delete" });

      // assert
      expect(jobScheduler.getSyncTapRepoJobs()).not.toContainEqual(
        expect.objectContaining({ did: followee.did }),
      );
    });
  });
});
