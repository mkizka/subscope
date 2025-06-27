import type { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import type { JobQueue } from "@repo/common/infrastructure";
import { schema } from "@repo/db";
import {
  actorFactory,
  recordFactory,
  setupTestDatabase,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";

import { FollowIndexingPolicy } from "../../../domain/follow-indexing-policy.js";
import { ActorRepository } from "../../../infrastructure/actor-repository.js";
import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { IndexActorService } from "../index-actor-service.js";
import { BackfillScheduler } from "../scheduler/backfill-scheduler.js";
import { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";
import { ResolveDidScheduler } from "../scheduler/resolve-did-scheduler.js";
import { FollowIndexer } from "./follow-indexer.js";

let followIndexer: FollowIndexer;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  followIndexer = testSetup.testInjector
    .provideClass("followRepository", FollowRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("followIndexingPolicy", FollowIndexingPolicy)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("actorRepository", ActorRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideValue("jobQueue", mock<JobQueue>())
    .provideClass("resolveDidScheduler", ResolveDidScheduler)
    .provideClass("backfillScheduler", BackfillScheduler)
    .provideClass("fetchRecordScheduler", FetchRecordScheduler)
    .provideClass("indexActorService", IndexActorService)
    .injectClass(FollowIndexer);
  ctx = testSetup.ctx;
});

describe("FollowIndexer", () => {
  describe("upsert", () => {
    it("フォローレコードを正しく保存する", async () => {
      // arrange
      const follower = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: followee.did,
        createdAt: new Date().toISOString(),
      };
      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower })
        .props({ json: () => followJson })
        .create();
      const record = Record.fromJson({
        uri: followRecord.uri,
        cid: followRecord.cid,
        json: followJson,
      });

      // act
      await followIndexer.upsert({ ctx, record });

      // assert
      const [follow] = await ctx.db
        .select()
        .from(schema.follows)
        .where(eq(schema.follows.uri, record.uri.toString()))
        .limit(1);
      expect(follow).toMatchObject({
        uri: record.uri.toString(),
        cid: record.cid.toString(),
        actorDid: follower.did,
        subjectDid: followee.did,
      });
    });

    it("フォロイーのactorが存在しない場合、自動的に作成される", async () => {
      // arrange
      const follower = await actorFactory(ctx.db).create();
      const followeeDid = "did:plc:nonexistent-followee";

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: followeeDid,
        createdAt: new Date().toISOString(),
      };
      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower })
        .props({ json: () => followJson })
        .create();
      const record = Record.fromJson({
        uri: followRecord.uri,
        cid: followRecord.cid,
        json: followJson,
      });

      // フォロイーのactorが存在しないことを確認
      const followeeBeforeUpsert = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, followeeDid))
        .limit(1);
      expect(followeeBeforeUpsert).toHaveLength(0);

      // act
      await followIndexer.upsert({ ctx, record });

      // assert
      // フォロイーのactorが作成されたことを確認
      const [followeeAfterUpsert] = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, followeeDid))
        .limit(1);
      expect(followeeAfterUpsert).toMatchObject({
        did: followeeDid,
        handle: null,
      });

      // フォローレコードも正しく保存されたことを確認
      const [follow] = await ctx.db
        .select()
        .from(schema.follows)
        .where(eq(schema.follows.uri, record.uri.toString()))
        .limit(1);
      expect(follow).toMatchObject({
        uri: record.uri.toString(),
        cid: record.cid.toString(),
        actorDid: follower.did,
        subjectDid: followeeDid,
      });
    });
  });

  describe("updateStats", () => {
    it("フォロー作成時にfollowsCountとfollowersCountが更新される", async () => {
      // arrange
      const follower = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: followee.did,
        createdAt: new Date().toISOString(),
      };
      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower })
        .props({ json: () => followJson })
        .create();
      const record = Record.fromJson({
        uri: followRecord.uri,
        cid: followRecord.cid,
        json: followJson,
      });

      // act
      await followIndexer.upsert({ ctx, record });
      await followIndexer.updateStats({ ctx, record });

      // assert
      // フォローした人のfollowsCountが更新される
      const [followerStats] = await ctx.db
        .select()
        .from(schema.actorStats)
        .where(eq(schema.actorStats.actorDid, follower.did));

      expect(followerStats).toMatchObject({
        actorDid: follower.did,
        followsCount: 1,
        followersCount: 0,
        postsCount: 0,
      });

      // フォローされた人のfollowersCountが更新される
      const [followeeStats] = await ctx.db
        .select()
        .from(schema.actorStats)
        .where(eq(schema.actorStats.actorDid, followee.did));

      expect(followeeStats).toMatchObject({
        actorDid: followee.did,
        followsCount: 0,
        followersCount: 1,
        postsCount: 0,
      });
    });
  });
});
