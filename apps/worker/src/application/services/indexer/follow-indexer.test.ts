import {
  actorFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("FollowIndexer", () => {
  let services: TestServices;
  beforeEach(async () => {
    services = await testRegistry.resolve();
  });

  describe("upsert", () => {
    test("フォローレコードを正しく保存する", async () => {
      const { followIndexer, followRepository, db } = services;
      const ctx = { db };
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
      const follow = followRepository.findByUri(record.uri);
      expect(follow).toMatchObject({
        uri: record.uri,
        cid: record.cid,
        actorDid: follower.did,
        subjectDid: followee.did,
      });
    });

    test("フォロワーがサブスクライバーの場合、フォロイーのDIDがTapに登録される", async () => {
      const { followIndexer, jobScheduler, subscriptionRepository, db } =
        services;
      const ctx = { db };
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      const subscription = subscriptionFactory({ actorDid: follower.did });
      subscriptionRepository.add(subscription);

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
      const addTapRepoJobs = jobScheduler.getAddTapRepoJobs();
      expect(addTapRepoJobs).toContainEqual(
        expect.objectContaining({ did: followee.did }),
      );
    });

    test("フォロワーがサブスクライバーでない場合、TapにDIDが登録されない", async () => {
      const { followIndexer, jobScheduler, db } = services;
      const ctx = { db };
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
      const addTapRepoJobs = jobScheduler.getAddTapRepoJobs();
      expect(addTapRepoJobs).not.toContainEqual(
        expect.objectContaining({ did: followee.did }),
      );
    });
  });

  describe("afterAction", () => {
    test("フォロー作成時にfollows/followers集計ジョブがスケジュールされる", async () => {
      const { followIndexer, jobScheduler, db } = services;
      const ctx = { db };
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

    test("フォロー削除時、フォロワーがサブスクライバーで他のサブスクライバーからフォローされていない場合、Tapから削除される", async () => {
      const {
        followIndexer,
        followRepository,
        jobScheduler,
        subscriptionRepository,
        db,
      } = services;
      const ctx = { db };
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      const subscription = subscriptionFactory({ actorDid: follower.did });
      subscriptionRepository.add(subscription);

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
      followRepository.deleteByUri(record.uri);

      // act
      await followIndexer.afterAction({ ctx, record, action: "delete" });

      // assert
      const removeTapRepoJobs = jobScheduler.getRemoveTapRepoJobs();
      expect(removeTapRepoJobs).toContainEqual(
        expect.objectContaining({ did: followee.did }),
      );
    });

    test("フォロー削除時、フォロワーがサブスクライバーでも他のサブスクライバーからフォローされている場合、Tapから削除されない", async () => {
      const {
        followIndexer,
        followRepository,
        jobScheduler,
        subscriptionRepository,
        db,
      } = services;
      const ctx = { db };
      // arrange
      const follower1 = actorFactory();
      const follower2 = actorFactory();
      const followee = actorFactory();
      const subscription1 = subscriptionFactory({ actorDid: follower1.did });
      const subscription2 = subscriptionFactory({ actorDid: follower2.did });
      subscriptionRepository.add(subscription1);
      subscriptionRepository.add(subscription2);

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
      followRepository.deleteByUri(record1.uri);

      // act
      await followIndexer.afterAction({
        ctx,
        record: record1,
        action: "delete",
      });

      // assert
      const removeTapRepoJobs = jobScheduler.getRemoveTapRepoJobs();
      expect(removeTapRepoJobs).not.toContainEqual(
        expect.objectContaining({ did: followee.did }),
      );
    });

    test("フォロー削除時、フォロワーがサブスクライバーでない場合、Tap削除処理は実行されない", async () => {
      const {
        followIndexer,
        followRepository,
        jobScheduler,
        subscriptionRepository,
        db,
      } = services;
      const ctx = { db };
      // arrange
      const subscriber = actorFactory();
      const nonSubscriber = actorFactory();
      const followee = actorFactory();
      const subscription = subscriptionFactory({ actorDid: subscriber.did });
      subscriptionRepository.add(subscription);

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
      followRepository.deleteByUri(nonSubscriberRecord.uri);

      // act
      await followIndexer.afterAction({
        ctx,
        record: nonSubscriberRecord,
        action: "delete",
      });

      // assert
      const removeTapRepoJobs = jobScheduler.getRemoveTapRepoJobs();
      expect(removeTapRepoJobs).not.toContainEqual(
        expect.objectContaining({ did: followee.did }),
      );
    });
  });
});
