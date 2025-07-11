import { asDid } from "@atproto/did";
import type { IJobQueue } from "@repo/common/domain";
import { asHandle } from "@repo/common/utils";
import { schema } from "@repo/db";
import { actorFactory, getTestSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";

import { ActorRepository } from "../../infrastructure/repositories/actor-repository.js";
import { ProfileRepository } from "../../infrastructure/repositories/profile-repository.js";
import { SubscriptionRepository } from "../../infrastructure/repositories/subscription-repository.js";
import { IndexActorService } from "./index-actor-service.js";
import { BackfillScheduler } from "./scheduler/backfill-scheduler.js";
import { FetchRecordScheduler } from "./scheduler/fetch-record-scheduler.js";
import { ResolveDidScheduler } from "./scheduler/resolve-did-scheduler.js";

describe("IndexActorService", () => {
  const mockJobQueue = mock<IJobQueue>();
  const { testInjector, ctx } = getTestSetup();

  const indexActorService = testInjector
    .provideClass("actorRepository", ActorRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("resolveDidScheduler", ResolveDidScheduler)
    .provideClass("backfillScheduler", BackfillScheduler)
    .provideClass("fetchRecordScheduler", FetchRecordScheduler)
    .injectClass(IndexActorService);

  describe("upsert", () => {
    it("handle指定あり、既存actorなしの場合は、actorを作成する", async () => {
      // arrange
      const testDid = asDid("did:plc:new-with-handle");
      const testHandle = asHandle("new-with-handle.bsky.social");

      // act
      await indexActorService.upsert({
        ctx,
        did: testDid,
        handle: testHandle,
        indexedAt: new Date(),
      });

      // assert
      const actors = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, testDid));
      expect(actors).toHaveLength(1);
      expect(actors[0]?.did).toBe(testDid);
      expect(actors[0]?.handle).toBe(testHandle);

      expect(mockJobQueue.add).not.toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: "backfill",
        }),
      );
      expect(mockJobQueue.add).toHaveBeenCalledWith({
        queueName: "fetchRecord",
        jobName: `at://${testDid}/app.bsky.actor.profile/self`,
        data: {
          uri: `at://${testDid}/app.bsky.actor.profile/self`,
          depth: 0,
        },
      });
    });

    it("handle指定あり、既存actorなしの場合は、backfillジョブを追加しない", async () => {
      // arrange
      const testDid = asDid("did:plc:new-no-backfill");
      const testHandle = asHandle("new-no-backfill.bsky.social");

      // act
      await indexActorService.upsert({
        ctx,
        did: testDid,
        handle: testHandle,
        indexedAt: new Date(),
      });

      // assert
      const actors = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, testDid));
      expect(actors).toHaveLength(1);
      expect(actors[0]?.did).toBe(testDid);
      expect(actors[0]?.handle).toBe(testHandle);

      expect(mockJobQueue.add).not.toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: "backfill",
        }),
      );
    });

    it("handle指定あり、既存actorあり、既存actorのhandleなしの場合は、handleを更新する", async () => {
      // arrange
      const existingDid = asDid("did:plc:no-handle-to-handle");
      const newHandle = asHandle("new-handle.bsky.social");
      await actorFactory(ctx.db)
        .props({
          did: () => existingDid,
          handle: () => null,
        })
        .create();

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
        handle: newHandle,
        indexedAt: new Date(),
      });

      // assert
      const actors = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, existingDid));
      expect(actors).toHaveLength(1);
      expect(actors[0]?.handle).toBe(newHandle);
      expect(mockJobQueue.add).not.toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: "backfill",
        }),
      );
    });

    it("handle指定あり、既存actorあり、既存actorのhandleありで同じ値の場合は、何もしない", async () => {
      // arrange
      const existingDid = asDid("did:plc:same-handle");
      const existingHandle = asHandle("same-handle.bsky.social");
      await actorFactory(ctx.db)
        .props({
          did: () => existingDid,
          handle: () => existingHandle,
        })
        .create();

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
        handle: existingHandle,
        indexedAt: new Date(),
      });

      // assert
      const actors = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, existingDid));
      expect(actors).toHaveLength(1);
      expect(actors[0]?.handle).toBe(existingHandle);
      expect(mockJobQueue.add).not.toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: "backfill",
        }),
      );
    });

    it("handle指定あり、既存actorあり、既存actorのhandleありで異なる値の場合は、handleを更新する", async () => {
      // arrange
      const existingDid = asDid("did:plc:changed-handle");
      const oldHandle = asHandle("old-handle.bsky.social");
      const newHandle = asHandle("new-handle.bsky.social");
      await actorFactory(ctx.db)
        .props({
          did: () => existingDid,
          handle: () => oldHandle,
        })
        .create();

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
        handle: newHandle,
        indexedAt: new Date(),
      });

      // assert
      const actors = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, existingDid));
      expect(actors).toHaveLength(1);
      expect(actors[0]?.handle).toBe(newHandle);
      expect(mockJobQueue.add).not.toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: "backfill",
        }),
      );
    });

    it("handle指定なし、既存actorなしの場合は、actorを作成してresolvDidジョブを追加する", async () => {
      // arrange
      const newDid = asDid("did:plc:new-no-handle");

      // act
      await indexActorService.upsert({
        ctx,
        did: newDid,
        indexedAt: new Date(),
      });

      // assert
      const actors = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, newDid));
      expect(actors).toHaveLength(1);
      expect(actors[0]?.did).toBe(newDid);
      expect(actors[0]?.handle).toBeNull();

      expect(mockJobQueue.add).toHaveBeenCalledWith({
        queueName: "resolveDid",
        jobName: `at://${newDid}`,
        data: newDid,
      });
      expect(mockJobQueue.add).not.toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: "backfill",
        }),
      );
    });

    it("handle指定なし、既存actorあり、既存actorのhandleなしの場合は、resolvDidジョブを追加する", async () => {
      // arrange
      const existingDidNoHandle = asDid("did:plc:existing-no-handle");
      await actorFactory(ctx.db)
        .props({
          did: () => existingDidNoHandle,
          handle: () => null,
        })
        .create();

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDidNoHandle,
        indexedAt: new Date(),
      });

      // assert
      const actors = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, existingDidNoHandle));
      expect(actors).toHaveLength(1);
      expect(actors[0]?.handle).toBeNull();

      expect(mockJobQueue.add).toHaveBeenCalledWith({
        queueName: "resolveDid",
        jobName: `at://${existingDidNoHandle}`,
        data: existingDidNoHandle,
      });
    });

    it("handle指定なし、既存actorあり、既存actorのhandleありの場合は、何もしない", async () => {
      // arrange
      const existingDid = asDid("did:plc:existing-with-handle");
      const existingHandle = asHandle("existing-with-handle.bsky.social");
      await actorFactory(ctx.db)
        .props({
          did: () => existingDid,
          handle: () => existingHandle,
        })
        .create();

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
        indexedAt: new Date(),
      });

      // assert
      const actors = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, existingDid));
      expect(actors).toHaveLength(1);
      expect(actors[0]?.handle).toBe(existingHandle);
      expect(mockJobQueue.add).not.toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: "backfill",
        }),
      );
    });
  });
});
