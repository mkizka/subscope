/* eslint-disable @typescript-eslint/unbound-method */
import { actorFactory, recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import { testInjector } from "../../../shared/test-utils.js";
import type { AggregateActorStatsScheduler } from "../scheduler/aggregate-actor-stats-scheduler.js";
import { FollowIndexer } from "./follow-indexer.js";

describe("FollowIndexer", () => {
  const mockAggregateActorStatsScheduler = mock<AggregateActorStatsScheduler>();

  const followIndexer = testInjector
    .provideValue(
      "aggregateActorStatsScheduler",
      mockAggregateActorStatsScheduler,
    )
    .injectClass(FollowIndexer);

  const actorRepo = testInjector.resolve("actorRepository");
  const followRepo = testInjector.resolve("followRepository");

  const createCtx = () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return { db: {} as never };
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
      const ctx = createCtx();
      await followIndexer.upsert({ ctx, record });

      // assert
      const follow = await followRepo.findByUri({
        ctx,
        uri: record.uri,
      });
      expect(follow).not.toBeNull();
      if (!follow) return;
      expect(follow.uri.toString()).toBe(record.uri.toString());
      expect(follow.cid).toBe(record.cid);
      expect(follow.actorDid).toBe(follower.did);
      expect(follow.subjectDid).toBe(followee.did);
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
      const ctx = createCtx();
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
      expect(follow).not.toBeNull();
      if (!follow) return;
      expect(follow.uri.toString()).toBe(record.uri.toString());
      expect(follow.cid).toBe(record.cid);
      expect(follow.actorDid).toBe(follower.did);
      expect(follow.subjectDid).toBe(followeeDid);
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

      const ctx = createCtx();
      await followIndexer.upsert({ ctx, record });

      // act
      await followIndexer.afterAction({ ctx, record });

      // assert
      expect(mockAggregateActorStatsScheduler.schedule).toHaveBeenCalledTimes(
        2,
      );
      expect(mockAggregateActorStatsScheduler.schedule).toHaveBeenNthCalledWith(
        1,
        follower.did,
        "follows",
      );
      expect(mockAggregateActorStatsScheduler.schedule).toHaveBeenNthCalledWith(
        2,
        followee.did,
        "followers",
      );
    });
  });
});
