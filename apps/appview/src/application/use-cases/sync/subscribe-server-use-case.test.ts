import { asDid } from "@atproto/did";
import {
  actorFactory,
  inviteCodeFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import {
  AlreadySubscribedError,
  InvalidInviteCodeError,
} from "./subscribe-server-use-case.js";

const now = new Date("2025-01-01T00:00:00Z");

describe("SubscribeServerUseCase", () => {
  let sut: TestServices["subscribeServerUseCase"];
  let subscriptionRepository: TestServices["subscriptionRepository"];
  let inviteCodeRepository: TestServices["inviteCodeRepository"];
  let actorRepository: TestServices["actorRepository"];
  let jobScheduler: TestServices["jobScheduler"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.subscribeServerUseCase;
    subscriptionRepository = services.subscriptionRepository;
    inviteCodeRepository = services.inviteCodeRepository;
    actorRepository = services.actorRepository;
    jobScheduler = services.jobScheduler;
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  test("有効な招待コードの場合、サブスクリプションを作成して招待コードの使用時間を更新する", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const inviteCode = inviteCodeFactory({ expiresAt: now });
    inviteCodeRepository.add(inviteCode);

    // act
    await sut.execute({
      code: inviteCode.code,
      actorDid: asDid(actor.did),
    });

    // assert
    const savedSubscription = await subscriptionRepository.findFirst(
      asDid(actor.did),
    );
    expect(savedSubscription).toMatchObject({
      actorDid: actor.did,
      inviteCode: inviteCode.code,
    });
    const updatedInviteCode = await inviteCodeRepository.findFirst(
      inviteCode.code,
    );
    expect(updatedInviteCode?.usedAt).toEqual(now);
    expect(jobScheduler.getAddTapRepoJobs()).toContainEqual(
      expect.objectContaining({ did: asDid(actor.did) }),
    );
  });

  test("招待コードが提供されない場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);

    // act & assert
    await expect(
      sut.execute({
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new InvalidInviteCodeError("Invite code is required"));
  });

  test("すでにサブスクライブ済みの場合、AlreadySubscribedErrorをthrowする", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const inviteCode = inviteCodeFactory();
    inviteCodeRepository.add(inviteCode);
    const subscription = subscriptionFactory({
      actorDid: actor.did,
      inviteCode: inviteCode.code,
    });
    subscriptionRepository.add(subscription);

    // act & assert
    await expect(
      sut.execute({
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
    actorRepository.add(actor);

    // act & assert
    await expect(
      sut.execute({
        code: "invalid-code",
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new InvalidInviteCodeError("Invalid invite code"));
  });

  test("招待コードが期限切れの場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const expiredInviteCode = inviteCodeFactory({
      expiresAt: new Date("2024-12-31T23:59:59.999Z"),
    });
    inviteCodeRepository.add(expiredInviteCode);

    // act & assert
    await expect(
      sut.execute({
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
    actorRepository.add(actor);
    const inviteCode = inviteCodeFactory({
      expiresAt: new Date("2025-01-01T00:00:00.001Z"),
      usedAt: new Date("2024-12-31T23:59:59.999Z"),
    });
    inviteCodeRepository.add(inviteCode);

    // act & assert
    await expect(
      sut.execute({
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
    inviteCodeRepository.add(inviteCode);

    // act
    await sut.execute({
      code: inviteCode.code,
      actorDid: did,
    });

    // assert
    const savedActor = await actorRepository.findByDid(did);
    expect(savedActor).toMatchObject({
      did,
      handle: null,
      indexedAt: now,
    });

    const savedSubscription = await subscriptionRepository.findFirst(did);
    expect(savedSubscription).toMatchObject({
      actorDid: did,
      inviteCode: inviteCode.code,
      createdAt: now,
    });
    expect(jobScheduler.getAddTapRepoJobs()).toContainEqual(
      expect.objectContaining({ did }),
    );
  });

  test("管理者の場合、招待コードなしでサブスクリプションを作成する", async () => {
    // arrange
    const admin = actorFactory({ isAdmin: true });
    actorRepository.add(admin);

    // act
    await sut.execute({
      actorDid: asDid(admin.did),
    });

    // assert
    const savedSubscription = await subscriptionRepository.findFirst(
      asDid(admin.did),
    );
    expect(savedSubscription).toMatchObject({
      actorDid: admin.did,
      inviteCode: null,
      createdAt: now,
    });
    expect(jobScheduler.getAddTapRepoJobs()).toContainEqual(
      expect.objectContaining({ did: asDid(admin.did) }),
    );
  });
});
