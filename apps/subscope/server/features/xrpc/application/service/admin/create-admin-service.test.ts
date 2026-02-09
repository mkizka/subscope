import { AtUri } from "@atproto/syntax";
import { Actor } from "@repo/common/domain";
import { actorFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "@/server/features/xrpc/test-utils.js";

import { CreateAdminService } from "./create-admin-service.js";

describe("CreateAdminService", () => {
  const createAdminService = testInjector.injectClass(CreateAdminService);
  const actorRepo = testInjector.resolve("actorRepository");
  const jobScheduler = testInjector.resolve("jobScheduler");
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
    expect(jobScheduler.getResolveDidJobs()).toContainEqual(
      expect.objectContaining({ did }),
    );
    expect(jobScheduler.getFetchRecordJobs()).toContainEqual(
      expect.objectContaining({
        uri: profileUri,
        depth: 0,
        live: true,
      }),
    );
  });

  test("actorが既に存在する場合、そのactorを管理者に昇格する", async () => {
    // arrange
    const existingActor = actorFactory();
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
        handle: existingActor.handle,
        isAdmin: true,
        indexedAt: expect.any(Date),
      }),
    );

    const profileUri = AtUri.make(
      existingActor.did,
      "app.bsky.actor.profile",
      "self",
    );
    expect(jobScheduler.getResolveDidJobs()).toHaveLength(0);
    expect(jobScheduler.getFetchRecordJobs()).toContainEqual(
      expect.objectContaining({
        uri: profileUri,
      }),
    );
  });
});
