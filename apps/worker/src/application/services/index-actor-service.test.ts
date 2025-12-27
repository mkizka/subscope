import { asDid } from "@atproto/did";
import { actorFactory } from "@repo/common/test";
import { asHandle } from "@repo/common/utils";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../shared/test-utils.js";
import { IndexActorService } from "./index-actor-service.js";

describe("IndexActorService", () => {
  const indexActorService = testInjector.injectClass(IndexActorService);

  const actorRepo = testInjector.resolve("actorRepository");
  const jobQueue = testInjector.resolve("jobQueue");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  describe("upsert", () => {
    test("handle指定あり、既存actorなしの場合は、actorを作成する", async () => {
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
      const actor = await actorRepo.findByDid({ ctx, did: testDid });
      expect(actor).toMatchObject({
        did: testDid,
        handle: testHandle,
      });

      expect(jobQueue.getJobs()).toContainEqual(
        expect.objectContaining({
          queueName: "fetchRecord",
          jobName: `at://${testDid}/app.bsky.actor.profile/self`,
          data: {
            uri: `at://${testDid}/app.bsky.actor.profile/self`,
            depth: 0,
          },
        }),
      );
    });

    test("handle指定あり、既存actorなしの場合は、fetchRecordジョブでプロファイルを取得する", async () => {
      // arrange
      const testDid = asDid("did:plc:new-no-syncrepo");
      const testHandle = asHandle("new-no-syncrepo.bsky.social");

      // act
      await indexActorService.upsert({
        ctx,
        did: testDid,
        handle: testHandle,
      });

      // assert
      const actor = await actorRepo.findByDid({ ctx, did: testDid });
      expect(actor).toMatchObject({
        did: testDid,
        handle: testHandle,
      });

      expect(jobQueue.getJobs()).toContainEqual(
        expect.objectContaining({
          queueName: "fetchRecord",
          jobName: `at://${testDid}/app.bsky.actor.profile/self`,
          data: {
            uri: `at://${testDid}/app.bsky.actor.profile/self`,
            depth: 0,
          },
        }),
      );
    });

    test("handle指定あり、既存actorあり、既存actorのhandleなしの場合は、handleを更新する", async () => {
      // arrange
      const existingDid = asDid("did:plc:no-handle-to-handle");
      const newHandle = asHandle("new-handle.bsky.social");
      const existingActor = actorFactory({
        did: existingDid,
        handle: null,
      });
      actorRepo.add(existingActor);

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
        handle: newHandle,
      });

      // assert
      const actor = await actorRepo.findByDid({ ctx, did: existingDid });
      expect(actor).toMatchObject({
        handle: newHandle,
      });
    });

    test("handle指定あり、既存actorあり、既存actorのhandleありで同じ値の場合は、何もしない", async () => {
      // arrange
      const existingDid = asDid("did:plc:same-handle");
      const existingHandle = asHandle("same-handle.bsky.social");
      const existingActor = actorFactory({
        did: existingDid,
        handle: existingHandle,
      });
      actorRepo.add(existingActor);

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
        handle: existingHandle,
      });

      // assert
      const actor = await actorRepo.findByDid({ ctx, did: existingDid });
      expect(actor).toMatchObject({
        handle: existingHandle,
      });
    });

    test("handle指定あり、既存actorあり、既存actorのhandleありで異なる値の場合は、handleを更新する", async () => {
      // arrange
      const existingDid = asDid("did:plc:changed-handle");
      const oldHandle = asHandle("old-handle.bsky.social");
      const newHandle = asHandle("new-handle.bsky.social");
      const existingActor = actorFactory({
        did: existingDid,
        handle: oldHandle,
      });
      actorRepo.add(existingActor);

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
        handle: newHandle,
      });

      // assert
      const actor = await actorRepo.findByDid({ ctx, did: existingDid });
      expect(actor).toMatchObject({
        handle: newHandle,
      });
    });

    test("handle指定なし、既存actorなしの場合は、actorを作成してresolvDidジョブを追加する", async () => {
      // arrange
      const newDid = asDid("did:plc:new-no-handle");

      // act
      await indexActorService.upsert({
        ctx,
        did: newDid,
      });

      // assert
      const actor = await actorRepo.findByDid({ ctx, did: newDid });
      expect(actor).toMatchObject({
        did: newDid,
        handle: null,
      });

      expect(jobQueue.getJobs()).toContainEqual(
        expect.objectContaining({
          queueName: "resolveDid",
          jobName: `at://${newDid}`,
          data: newDid,
        }),
      );
    });

    test("handle指定なし、既存actorあり、既存actorのhandleなしの場合は、resolvDidジョブを追加する", async () => {
      // arrange
      const existingDidNoHandle = asDid("did:plc:existing-no-handle");
      const existingActor = actorFactory({
        did: existingDidNoHandle,
        handle: null,
      });
      actorRepo.add(existingActor);

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDidNoHandle,
      });

      // assert
      const actor = await actorRepo.findByDid({
        ctx,
        did: existingDidNoHandle,
      });
      expect(actor).toMatchObject({
        handle: null,
      });

      expect(jobQueue.getJobs()).toContainEqual(
        expect.objectContaining({
          queueName: "resolveDid",
          jobName: `at://${existingDidNoHandle}`,
          data: existingDidNoHandle,
        }),
      );
    });

    test("handle指定なし、既存actorあり、既存actorのhandleありの場合は、何もしない", async () => {
      // arrange
      const existingDid = asDid("did:plc:existing-with-handle");
      const existingHandle = asHandle("existing-with-handle.bsky.social");
      const existingActor = actorFactory({
        did: existingDid,
        handle: existingHandle,
      });
      actorRepo.add(existingActor);

      // act
      await indexActorService.upsert({
        ctx,
        did: existingDid,
      });

      // assert
      const actor = await actorRepo.findByDid({ ctx, did: existingDid });
      expect(actor).toMatchObject({
        handle: existingHandle,
      });
    });
  });
});
