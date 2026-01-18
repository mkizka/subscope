import { AtUri } from "@atproto/syntax";
import { Actor } from "@repo/common/domain";
import { actorFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../test-utils.js";
import { CreateAdminService } from "./create-admin-service.js";

describe("CreateAdminService", () => {
  const createAdminService = testInjector.injectClass(CreateAdminService);
  const actorRepo = testInjector.resolve("actorRepository");
  const jobQueue = testInjector.resolve("jobQueue");
  const db = testInjector.resolve("db");

  test("actorが存在しない場合、新規作成して管理者に昇格しジョブをスケジュールする", async () => {
    // arrange
    const did = "did:plc:newactor";

    // act
    await createAdminService.execute({
      ctx: { db },
      did,
    });

    // assert
    const savedActor = await actorRepo.findByDid(did);
    expect(savedActor).toEqual(
      Actor.reconstruct({
        did,
        handle: null,
        isAdmin: true,
        indexedAt: expect.any(Date),
      }),
    );

    const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
    const jobs = jobQueue.getJobs();
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      queueName: "resolveDid",
      data: did,
    });
    expect(jobs[1]).toMatchObject({
      queueName: "fetchRecord",
      jobName: profileUri.toString(),
      data: {
        uri: profileUri.toString(),
        depth: 0,
        live: true,
      },
    });
  });

  test("actorが既に存在する場合、新規actorで上書きして管理者に昇格する", async () => {
    // arrange
    const existingActor = actorFactory({ handle: "existing.test" });
    actorRepo.add(existingActor);

    // act
    await createAdminService.execute({
      ctx: { db },
      did: existingActor.did,
    });

    // assert
    const savedActor = await actorRepo.findByDid(existingActor.did);
    expect(savedActor).toEqual(
      Actor.reconstruct({
        did: existingActor.did,
        handle: null,
        isAdmin: true,
        indexedAt: expect.any(Date),
      }),
    );

    const profileUri = AtUri.make(
      existingActor.did,
      "app.bsky.actor.profile",
      "self",
    );
    const jobs = jobQueue.getJobs();
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      queueName: "resolveDid",
      data: existingActor.did,
    });
    expect(jobs[1]).toMatchObject({
      queueName: "fetchRecord",
      jobName: profileUri.toString(),
    });
  });
});
