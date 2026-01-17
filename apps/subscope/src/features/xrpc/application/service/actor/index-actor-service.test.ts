import { AtUri } from "@atproto/syntax";
import { actorFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../test-utils.js";
import { IndexActorService } from "./index-actor-service.js";

describe("IndexActorService", () => {
  const indexActorService = testInjector.injectClass(IndexActorService);
  const actorRepo = testInjector.resolve("actorRepository");
  const jobQueue = testInjector.resolve("jobQueue");
  const db = testInjector.resolve("db");

  test("actorが存在しない場合、新規作成してfetchRecordジョブをスケジュールする", async () => {
    // arrange
    const did = "did:plc:newactor";

    // act
    const actor = await indexActorService.upsert({
      ctx: { db },
      did,
    });

    // assert
    expect(actor.did).toBe(did);
    const savedActor = await actorRepo.findByDid(did);
    expect(savedActor).not.toBeNull();
    expect(savedActor?.did).toBe(did);

    const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
    const jobs = jobQueue.getJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      queueName: "fetchRecord",
      jobName: profileUri.toString(),
      data: {
        uri: profileUri.toString(),
        depth: 0,
        live: false,
      },
    });
  });

  test("actorが既に存在する場合、既存のactorを返す", async () => {
    // arrange
    const existingActor = actorFactory({ handle: "existing.test" });
    actorRepo.add(existingActor);

    // act
    const actor = await indexActorService.upsert({
      ctx: { db },
      did: existingActor.did,
    });

    // assert
    expect(actor.did).toBe(existingActor.did);
    expect(actor.handle).toBe(existingActor.handle);
  });

  test("actorが既に存在する場合、fetchRecordジョブをスケジュールしない", async () => {
    // arrange
    const existingActor = actorFactory();
    actorRepo.add(existingActor);

    // act
    await indexActorService.upsert({
      ctx: { db },
      did: existingActor.did,
    });

    // assert
    const jobs = jobQueue.getJobs();
    expect(jobs).toHaveLength(0);
  });
});
