import type { IJobQueue } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  followFactory,
  recordFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import { ActorRepository } from "../../../infrastructure/repositories/actor-repository.js";
import { PostgresIndexTargetRepository } from "../../../infrastructure/repositories/index-target-repository/postgres-index-target-repository.js";
import { ProfileRepository } from "../../../infrastructure/repositories/profile-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/repositories/subscription-repository/subscription-repository.js";
import { TrackedActorChecker } from "../../../infrastructure/repositories/tracked-actor-checker/tracked-actor-checker.js";
import { IndexActorService } from "../../services/index-actor-service.js";
import { FetchRecordScheduler } from "../../services/scheduler/fetch-record-scheduler.js";
import { ResolveDidScheduler } from "../../services/scheduler/resolve-did-scheduler.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";
import { UpsertIdentityUseCase } from "./upsert-identity-use-case.js";

describe("UpsertIdentityUseCase", () => {
  const mockJobQueue = mock<IJobQueue>();
  const { testInjector, ctx } = testSetup;

  const upsertIdentityUseCase = testInjector
    .provideClass("actorRepository", ActorRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("trackedActorChecker", TrackedActorChecker)
    .provideClass("indexTargetRepository", PostgresIndexTargetRepository)
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("resolveDidScheduler", ResolveDidScheduler)
    .provideClass("fetchRecordScheduler", FetchRecordScheduler)
    .provideClass("indexActorService", IndexActorService)
    .injectClass(UpsertIdentityUseCase);

  test("ハンドルがない場合は何もしない", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:nohandle",
      handle: undefined,
      indexedAt: new Date(),
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, command.did));
    expect(actors.length).toBe(0);
  });

  test("subscriberの場合はactorを保存する", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:identity-subscriber",
      handle: "identity-subscriber.bsky.social",
      indexedAt: new Date(),
    };

    // actorを先に作成
    const actor = await actorFactory(ctx.db)
      .props({
        did: () => command.did,
        handle: () => "old-handle.bsky.social",
      })
      .create();

    // subscriberとして登録
    await subscriptionFactory(ctx.db)
      .vars({ actor: () => actor })
      .create();

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, command.did));
    expect(actors.length).toBe(1);
    expect(actors[0]?.handle).toBe(command.handle);
  });

  test("subscriberでないがsubscriberのフォロワーがいる場合はactorを保存する", async () => {
    // arrange
    const subscriberDid = "did:plc:identity-follower-subscriber";
    const followedDid = "did:plc:identity-followed";
    const command: UpsertIdentityCommand = {
      did: followedDid,
      handle: "identity-followed.bsky.social",
      indexedAt: new Date(),
    };

    // subscriberを作成
    const subscriberActor = await actorFactory(ctx.db)
      .props({
        did: () => subscriberDid,
        handle: () => "identity-follower-subscriber.bsky.social",
      })
      .create();

    await subscriptionFactory(ctx.db)
      .vars({ actor: () => subscriberActor })
      .create();

    // followedDidのactorを先に作成（外部キー制約のため）
    const followedActor = await actorFactory(ctx.db)
      .props({
        did: () => followedDid,
      })
      .create();

    // subscriberがfollowedDidをフォロー
    const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
      .vars({ actorDid: () => subscriberActor.did })
      .props({
        json: () => ({
          $type: "app.bsky.graph.follow",
          subject: followedDid,
          createdAt: new Date().toISOString(),
        }),
      })
      .create();

    await followFactory(ctx.db)
      .vars({
        record: () => followRecord,
        followee: () => followedActor,
      })
      .create();

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, command.did));
    expect(actors.length).toBe(1);
    expect(actors[0]?.handle).toBe(command.handle);
  });

  test("subscriberでもなくsubscriberのフォロワーもいない場合はactorを保存しない", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:identity-unrelated",
      handle: "identity-unrelated.bsky.social",
      indexedAt: new Date(),
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, command.did));
    expect(actors.length).toBe(0);
  });
});
