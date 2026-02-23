import { asDid } from "@atproto/did";
import { actorFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { testInjector } from "@/server/features/xrpc/test-utils.js";

import {
  AdminAlreadyExistsError,
  RegisterAdminUseCase,
} from "./register-admin-use-case.js";

const now = new Date("2025-01-01T00:00:00Z");

describe("RegisterAdminUseCase", () => {
  const registerAdminUseCase = testInjector.injectClass(RegisterAdminUseCase);
  const actorRepo = testInjector.resolve("actorRepository");
  const subscriptionRepo = testInjector.resolve("subscriptionRepository");
  const jobScheduler = testInjector.resolve("jobScheduler");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  test("管理者が存在しない場合、リクエストユーザーを管理者に昇格しサブスクリプションも作成する", async () => {
    // arrange
    const requester = actorFactory({ isAdmin: false });
    actorRepo.add(requester);

    // act
    await registerAdminUseCase.execute({
      requesterDid: requester.did,
    });

    // assert
    const updatedActor = await actorRepo.findByDid(requester.did);
    expect(updatedActor?.isAdmin).toBe(true);
    const subscription = await subscriptionRepo.findFirst(asDid(requester.did));
    expect(subscription).toMatchObject({
      actorDid: requester.did,
      createdAt: now,
    });
    expect(jobScheduler.getAddTapRepoJobs()).toContainEqual(
      expect.objectContaining({ did: asDid(requester.did) }),
    );
  });

  test("管理者が既に存在する場合、AdminAlreadyExistsErrorをスローする", async () => {
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorRepo.add(admin);

    const requester = actorFactory({ isAdmin: false });
    actorRepo.add(requester);

    // act & assert
    await expect(
      registerAdminUseCase.execute({
        requesterDid: requester.did,
      }),
    ).rejects.toThrow(AdminAlreadyExistsError);
  });

  test("リクエストユーザーが存在しない場合、新規作成して管理者に昇格する", async () => {
    // arrange
    const nonExistentDid = "did:plc:nonexistent";

    // act
    await registerAdminUseCase.execute({
      requesterDid: nonExistentDid,
    });

    // assert
    const createdActor = await actorRepo.findByDid(nonExistentDid);
    expect(createdActor).not.toBeNull();
    expect(createdActor?.isAdmin).toBe(true);
  });
});
