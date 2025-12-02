import { AtUri } from "@atproto/syntax";
import { actorFactory, recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { FollowIndexer } from "./follow-indexer.js";

describe("FollowIndexer", () => {
  const followIndexer = testInjector.injectClass(FollowIndexer);

  const actorRepo = testInjector.resolve("actorRepository");
  const followRepo = testInjector.resolve("followRepository");
  const jobQueue = testInjector.resolve("jobQueue");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  describe("upsert", () => {
    test("フォローレコードを正しく保存する", async () => {
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      actorRepo.add(follower);
      actorRepo.add(followee);

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: followee.did,
        createdAt: new Date().toISOString(),
      };
      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/followrkey123`,
        cid: "bafyreifakecid123",
        json: followJson,
      });

      // act
      await followIndexer.upsert({ ctx, record });

      // assert
      const follow = await followRepo.findByUri({
        ctx,
        uri: record.uri,
      });
      expect(follow).toMatchObject({
        uri: new AtUri(record.uri.toString()),
        cid: record.cid,
        actorDid: follower.did,
        subjectDid: followee.did,
      });
    });

    test("フォロイーのactorが存在しない場合、自動的に作成される", async () => {
      // arrange
      const follower = actorFactory();
      actorRepo.add(follower);
      const followeeDid = "did:plc:nonexistent-followee";

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: followeeDid,
        createdAt: new Date().toISOString(),
      };
      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/followrkey456`,
        cid: "bafyreifakecid456",
        json: followJson,
      });

      // フォロイーのactorが存在しないことを確認
      const followeeBeforeUpsert = await actorRepo.findByDid({
        ctx,
        did: followeeDid,
      });
      expect(followeeBeforeUpsert).toBeNull();

      // act
      await followIndexer.upsert({ ctx, record });

      // assert
      // フォロイーのactorが作成されたことを確認
      const followeeAfterUpsert = await actorRepo.findByDid({
        ctx,
        did: followeeDid,
      });
      expect(followeeAfterUpsert).toMatchObject({
        did: followeeDid,
        handle: null,
      });

      // フォローレコードも正しく保存されたことを確認
      const follow = await followRepo.findByUri({
        ctx,
        uri: record.uri,
      });
      expect(follow).toMatchObject({
        uri: new AtUri(record.uri.toString()),
        cid: record.cid,
        actorDid: follower.did,
        subjectDid: followeeDid,
      });
    });
  });

  describe("afterAction", () => {
    test("フォロー作成時にfollows/followers集計ジョブがスケジュールされる", async () => {
      // arrange
      const follower = actorFactory();
      const followee = actorFactory();
      actorRepo.add(follower);
      actorRepo.add(followee);

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: followee.did,
        createdAt: new Date().toISOString(),
      };
      const record = recordFactory({
        uri: `at://${follower.did}/app.bsky.graph.follow/followrkey789`,
        cid: "bafyreifakecid789",
        json: followJson,
      });

      await followIndexer.upsert({ ctx, record });

      // act
      await followIndexer.afterAction({ ctx, record });

      // assert
      const jobs = jobQueue
        .getAddedJobs()
        .filter((job) => job.queueName === "aggregateActorStats");
      expect(jobs).toHaveLength(2);
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
