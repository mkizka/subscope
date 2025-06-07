import { asDid } from "@atproto/did";
import type { IJobQueue, TransactionContext } from "@dawn/common/domain";
import { asHandle } from "@dawn/common/utils";
import { schema } from "@dawn/db";
import { setupTestDatabase } from "@dawn/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";

import { ActorRepository } from "../../../infrastructure/actor-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { BackfillService } from "../backfill/backfill-service.js";
import { FetchProfileService } from "../profile/fetch-profile-service.js";
import { IndexActorService } from "./index-actor-service.js";
import { ResolveDidService } from "./resolve-did-service.js";

const mockJobQueue = mock<IJobQueue>();
const { getSetup } = setupTestDatabase();

let indexActorService: IndexActorService;
let ctx: TransactionContext;

beforeAll(() => {
  const testSetup = getSetup();
  indexActorService = testSetup.testInjector
    .provideClass("actorRepository", ActorRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("resolveDidService", ResolveDidService)
    .provideClass("backfillService", BackfillService)
    .provideClass("fetchProfileService", FetchProfileService)
    .injectClass(IndexActorService);
  ctx = testSetup.ctx;
});

describe("IndexActorService", () => {
  beforeEach(() => {
    mockJobQueue.add.mockClear();
  });

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
        queueName: "fetchProfile",
        jobName: `at://${testDid}/app.bsky.actor.profile/self`,
        data: testDid,
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
      await ctx.db.insert(schema.actors).values({
        did: existingDid,
        handle: null,
      });

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
        handle: newHandle,
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
      await ctx.db.insert(schema.actors).values({
        did: existingDid,
        handle: existingHandle,
      });

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
        handle: existingHandle,
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
      await ctx.db.insert(schema.actors).values({
        did: existingDid,
        handle: oldHandle,
      });

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
        handle: newHandle,
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
      await ctx.db.insert(schema.actors).values({
        did: existingDidNoHandle,
        handle: null,
      });

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDidNoHandle,
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
      await ctx.db.insert(schema.actors).values({
        did: existingDid,
        handle: existingHandle,
      });

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
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
