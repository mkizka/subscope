import {
  actorFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { FollowIndexer } from "./follow-indexer.js";

describe("FollowIndexer", () => {
  const followIndexer = testInjector.injectClass(FollowIndexer);

  const followRepo = testInjector.resolve("followRepository");
  const jobQueue = testInjector.resolve("jobQueue");
  const subscriptionRepo = testInjector.resolve("subscriptionRepository");

  const ctx = {
    db: testInjector.resolve("db"),
  };

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

    test("フォロワーがサブスクライバーの場合、フォロイーのDIDがTapに登録される", async () => {
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
      const addTapRepoJobs = jobQueue.findByQueueName("addTapRepo");
      expect(addTapRepoJobs).toContainEqual(
        expect.objectContaining({ data: followee.did }),
      );
    });

    test("フォロワーがサブスクライバーでない場合、TapにDIDが登録されない", async () => {
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
      const addTapRepoJobs = jobQueue.findByQueueName("addTapRepo");
      expect(addTapRepoJobs).not.toContainEqual(
        expect.objectContaining({ data: followee.did }),
      );
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
      const jobs = jobQueue.findByQueueName("aggregateActorStats");
      expect(jobs).toMatchObject([
        {
          queueName: "aggregateActorStats",
          data: {
            did: follower.did,
            type: "follows",
          },
        },
        {
          queueName: "aggregateActorStats",
          data: {
            did: followee.did,
            type: "followers",
          },
        },
      ]);
    });

    test("フォロー削除時、フォロワーがサブスクライバーで他のサブスクライバーからフォローされていない場合、Tapから削除される", async () => {
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
      const removeTapRepoJobs = jobQueue.findByQueueName("removeTapRepo");
      expect(removeTapRepoJobs).toContainEqual(
        expect.objectContaining({ data: followee.did }),
      );
    });

    test("フォロー削除時、フォロワーがサブスクライバーでも他のサブスクライバーからフォローされている場合、Tapから削除されない", async () => {
      // arrange
      const follower1 = actorFactory();
      const follower2 = actorFactory();
      const followee = actorFactory();
      const subscription1 = subscriptionFactory({ actorDid: follower1.did });
      const subscription2 = subscriptionFactory({ actorDid: follower2.did });
      subscriptionRepo.add(subscription1);
      subscriptionRepo.add(subscription2);

      const record1 = recordFactory({
        uri: `at://${follower1.did}/app.bsky.graph.follow/followrkey_delete2a`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });
      const record2 = recordFactory({
        uri: `at://${follower2.did}/app.bsky.graph.follow/followrkey_delete2b`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });
      await followIndexer.upsert({
        ctx,
        record: record1,
        live: false,
      });
      await followIndexer.upsert({
        ctx,
        record: record2,
        live: false,
      });
      followRepo.deleteByUri(record1.uri);

      // act
      await followIndexer.afterAction({
        ctx,
        record: record1,
        action: "delete",
      });

      // assert
      const removeTapRepoJobs = jobQueue.findByQueueName("removeTapRepo");
      expect(removeTapRepoJobs).not.toContainEqual(
        expect.objectContaining({ data: followee.did }),
      );
    });

    test("フォロー削除時、フォロワーがサブスクライバーでない場合、Tap削除処理は実行されない", async () => {
      // arrange
      const subscriber = actorFactory();
      const nonSubscriber = actorFactory();
      const followee = actorFactory();
      const subscription = subscriptionFactory({ actorDid: subscriber.did });
      subscriptionRepo.add(subscription);

      const subscriberRecord = recordFactory({
        uri: `at://${subscriber.did}/app.bsky.graph.follow/followrkey_delete3a`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });
      const nonSubscriberRecord = recordFactory({
        uri: `at://${nonSubscriber.did}/app.bsky.graph.follow/followrkey_delete3b`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followee.did,
          createdAt: new Date().toISOString(),
        },
      });
      await followIndexer.upsert({
        ctx,
        record: subscriberRecord,
        live: false,
      });
      await followIndexer.upsert({
        ctx,
        record: nonSubscriberRecord,
        live: false,
      });
      followRepo.deleteByUri(nonSubscriberRecord.uri);

      // act
      await followIndexer.afterAction({
        ctx,
        record: nonSubscriberRecord,
        action: "delete",
      });

      // assert
      const removeTapRepoJobs = jobQueue.findByQueueName("removeTapRepo");
      expect(removeTapRepoJobs).not.toContainEqual(
        expect.objectContaining({ data: followee.did }),
      );
    });
  });
});
