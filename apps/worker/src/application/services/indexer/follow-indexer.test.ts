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
  const tapClient = testInjector.resolve("tapClient");
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
      await followIndexer.upsert({ ctx, record });

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
      await followIndexer.upsert({ ctx, record });

      // assert
      const registeredDids = tapClient.getRegisteredDids();
      expect(registeredDids).toContain(followee.did);
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
      await followIndexer.upsert({ ctx, record });

      // assert
      const registeredDids = tapClient.getRegisteredDids();
      expect(registeredDids).not.toContain(followee.did);
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
      await followIndexer.upsert({ ctx, record });

      // act
      await followIndexer.afterAction({ ctx, record });

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
  });
});
