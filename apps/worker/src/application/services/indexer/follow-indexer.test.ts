import type { AfterCommitContext } from "@repo/common/domain";
import {
  actorFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import {
  afterCommit,
  testRegistry,
  type TestServices,
} from "../../../shared/test-utils.js";

describe("FollowIndexer", () => {
  let followIndexer: TestServices["followIndexer"];
  let followRepo: TestServices["followRepository"];
  let jobScheduler: TestServices["jobScheduler"];
  let subscriptionRepo: TestServices["subscriptionRepository"];
  let notificationRepo: TestServices["notificationRepository"];
  let db: TestServices["db"];
  let ctx: AfterCommitContext;
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    followIndexer = services.followIndexer;
    followRepo = services.followRepository;
    jobScheduler = services.jobScheduler;
    subscriptionRepo = services.subscriptionRepository;
    notificationRepo = services.notificationRepository;
    db = services.db;
    ctx = { db, afterCommit };
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

    test("notify-5: フォローされたアカウントに follow の通知を作る", async () => {
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
  });
});
