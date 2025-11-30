import { asDid } from "@atproto/did";
import type { IJobQueue } from "@repo/common/domain";
import {
  actorFactory,
  inviteCodeFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { testInjector } from "../shared/test-utils.js";
import { SyncRepoScheduler } from "./service/scheduler/sync-repo-scheduler.js";
import {
  AlreadySubscribedError,
  InvalidInviteCodeError,
  SubscribeServerUseCase,
} from "./subscribe-server-use-case.js";

const now = new Date("2025-01-01T00:00:00Z");

describe("SubscribeServerUseCase", () => {
  const mockJobQueue = mock<IJobQueue>();

  const subscribeServerUseCase = testInjector
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("syncRepoScheduler", SyncRepoScheduler)
    .injectClass(SubscribeServerUseCase);

  const subscriptionRepo = testInjector.resolve("subscriptionRepository");
  const inviteCodeRepo = testInjector.resolve("inviteCodeRepository");
  const actorRepo = testInjector.resolve("actorRepository");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    mockJobQueue.add.mockReset();
  });

  test("有効な招待コードの場合、サブスクリプションを作成して招待コードの使用時間を更新する", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);
    const inviteCode = inviteCodeFactory({ expiresAt: now });
    inviteCodeRepo.add(inviteCode);

    // act
    await subscribeServerUseCase.execute({
      code: inviteCode.code,
      actorDid: asDid(actor.did),
    });

    // assert
    const savedSubscription = await subscriptionRepo.findFirst(
      asDid(actor.did),
    );
    expect(savedSubscription).toMatchObject({
      actorDid: actor.did,
      inviteCode: inviteCode.code,
    });
    const updatedInviteCode = await inviteCodeRepo.findFirst(inviteCode.code);
    expect(updatedInviteCode?.usedAt).toEqual(now);
    expect(mockJobQueue.add).toHaveBeenCalledWith({
      queueName: "syncRepo",
      jobName: `at://${actor.did}`,
      data: asDid(actor.did),
    });
  });

  test("招待コードが提供されない場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new InvalidInviteCodeError("Invite code is required"));
  });

  test("すでにサブスクライブ済みの場合、AlreadySubscribedErrorをthrowする", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);
    const inviteCode = inviteCodeFactory();
    inviteCodeRepo.add(inviteCode);
    const subscription = subscriptionFactory({
      actorDid: actor.did,
      inviteCode: inviteCode.code,
    });
    subscriptionRepo.add(subscription);

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        code: "test-code",
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(
      new AlreadySubscribedError("Already subscribed to this server"),
    );
  });

  test("招待コードが存在しない場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        code: "invalid-code",
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new InvalidInviteCodeError("Invalid invite code"));
  });

  test("招待コードが期限切れの場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);
    const expiredInviteCode = inviteCodeFactory({
      expiresAt: new Date("2024-12-31T23:59:59.999Z"),
    });
    inviteCodeRepo.add(expiredInviteCode);

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        code: expiredInviteCode.code,
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(
      new InvalidInviteCodeError(
        "Invite code has expired or already been used",
      ),
    );
  });

  test("招待コードがすでに使用されている場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);
    const inviteCode = inviteCodeFactory({
      expiresAt: new Date("2025-01-01T00:00:00.001Z"),
      usedAt: new Date("2024-12-31T23:59:59.999Z"),
    });
    inviteCodeRepo.add(inviteCode);

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        code: inviteCode.code,
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(
      new InvalidInviteCodeError(
        "Invite code has expired or already been used",
      ),
    );
  });

  test("Actorが存在しない場合、Actorを作成してサブスクリプションを作成する", async () => {
    // arrange
    const did = asDid("did:plc:test123456789abcdefghijk");
    const inviteCode = inviteCodeFactory({ expiresAt: now });
    inviteCodeRepo.add(inviteCode);

    // act
    await subscribeServerUseCase.execute({
      code: inviteCode.code,
      actorDid: did,
    });

    // assert
    const savedActor = await actorRepo.findByDid(did);
    expect(savedActor).toMatchObject({
      did,
      handle: null,
      syncRepoStatus: "dirty",
      syncRepoVersion: null,
      indexedAt: now,
    });

    const savedSubscription = await subscriptionRepo.findFirst(did);
    expect(savedSubscription).toMatchObject({
      actorDid: did,
      inviteCode: inviteCode.code,
      createdAt: now,
    });
  });
});
