import { Record } from "@repo/common/domain";
import type { JobQueue } from "@repo/common/infrastructure";
import { schema } from "@repo/db";
import { actorFactory, getTestSetup, recordFactory } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import { FollowIndexingPolicy } from "../../../domain/follow-indexing-policy.js";
import { ActorRepository } from "../../../infrastructure/repositories/actor-repository.js";
import { ActorStatsRepository } from "../../../infrastructure/repositories/actor-stats-repository.js";
import { FollowRepository } from "../../../infrastructure/repositories/follow-repository.js";
import { ProfileRepository } from "../../../infrastructure/repositories/profile-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/repositories/subscription-repository.js";
import { IndexActorService } from "../index-actor-service.js";
import { BackfillScheduler } from "../scheduler/backfill-scheduler.js";
import { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";
import { ResolveDidScheduler } from "../scheduler/resolve-did-scheduler.js";
import { FollowIndexer } from "./follow-indexer.js";

describe("FollowIndexer", () => {
  const { testInjector, ctx } = getTestSetup();

  const followIndexer = testInjector
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

  describe("upsert", () => {
    test("非サブスクライバーがフォローした場合、フォローレコードが保存され、フォロイーのisFollowedBySubscriberがfalseになる", async () => {
      // arrange
      const [follower, followee] = await actorFactory(ctx.db).createList(2);

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
        indexedAt: new Date(),
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
        cid: record.cid,
        actorDid: follower.did,
        subjectDid: followee.did,
      });

      const [followeeActor] = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, followee.did))
        .limit(1);
      expect(followeeActor?.isFollowedBySubscriber).toBe(false);
    });

    test("サブスクライバーがフォローした場合、フォロイーのisFollowedBySubscriberがtrueになる", async () => {
      // arrange
      const [subscriber, followee] = await actorFactory(ctx.db).createList(2);
      await ctx.db
        .insert(schema.subscriptions)
        .values({ actorDid: subscriber.did, createdAt: new Date() });

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: followee.did,
        createdAt: new Date().toISOString(),
      };
      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => subscriber })
        .props({ json: () => followJson })
        .create();
      const record = Record.fromJson({
        uri: followRecord.uri,
        cid: followRecord.cid,
        json: followJson,
        indexedAt: new Date(),
      });

      // act
      await followIndexer.upsert({ ctx, record });

      // assert
      const [followeeActor] = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, followee.did))
        .limit(1);
      expect(followeeActor?.isFollowedBySubscriber).toBe(true);
    });

    test("フォロイーのactorが存在しない場合、自動的に作成される", async () => {
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
        indexedAt: new Date(),
      });

      // act
      await followIndexer.upsert({ ctx, record });

      // assert
      const [followeeActor] = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, followeeDid))
        .limit(1);
      expect(followeeActor).toMatchObject({
        did: followeeDid,
        handle: null,
        isFollowedBySubscriber: false,
      });

      const [follow] = await ctx.db
        .select()
        .from(schema.follows)
        .where(eq(schema.follows.uri, record.uri.toString()))
        .limit(1);
      expect(follow).toMatchObject({
        uri: record.uri.toString(),
        cid: record.cid,
        actorDid: follower.did,
        subjectDid: followeeDid,
      });
    });
  });

  describe("updateStats", () => {
    test("フォロー作成時にfollowsCountとfollowersCountが更新される", async () => {
      // arrange
      const [follower, followee] = await actorFactory(ctx.db).createList(2);

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
        indexedAt: new Date(),
      });

      // act
      await followIndexer.upsert({ ctx, record });
      await followIndexer.updateStats({ ctx, record });

      // assert
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
