import { asDid } from "@atproto/did";
import type { IJobQueue } from "@repo/common/domain";
import { TransactionManager } from "@repo/common/infrastructure";
import {
  actorFactory,
  getTestSetup,
  inviteCodeFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { ActorRepository } from "../infrastructure/actor-repository.js";
import { InviteCodeRepository } from "../infrastructure/invite-code-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { SyncRepoScheduler } from "./service/scheduler/sync-repo-scheduler.js";
import {
  AlreadySubscribedError,
  InvalidInviteCodeError,
  SubscribeServerUseCase,
} from "./subscribe-server-use-case.js";

const now = new Date("2025-01-01T00:00:00Z");

describe("SubscribeServerUseCase", () => {
  const mockJobQueue = mock<IJobQueue>();
  const { testInjector, ctx } = getTestSetup();

  const subscribeServerUseCase = testInjector
    .provideClass("transactionManager", TransactionManager)
    .provideClass("actorRepository", ActorRepository)
    .provideClass("inviteCodeRepository", InviteCodeRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("syncRepoScheduler", SyncRepoScheduler)
    .injectClass(SubscribeServerUseCase);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  test("有効な招待コードの場合、サブスクリプションを作成して招待コードの使用時間を更新する", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({
        expiresAt: () => now,
      })
      .create();

    // act
    await subscribeServerUseCase.execute({
      code: inviteCode.code,
      actorDid: asDid(actor.did),
    });

    // assert
    const savedSubscription = await ctx.db.query.subscriptions.findFirst({
      where: (subscriptions, { eq }) => eq(subscriptions.actorDid, actor.did),
    });
    expect(savedSubscription).toMatchObject({
      actorDid: actor.did,
      inviteCode: inviteCode.code,
    });
    const updatedInviteCode = await ctx.db.query.inviteCodes.findFirst({
      where: (inviteCodes, { eq }) => eq(inviteCodes.code, inviteCode.code),
    });
    expect(updatedInviteCode?.usedAt).toEqual(now);
    expect(mockJobQueue.add).toHaveBeenCalledWith({
      queueName: "syncRepo",
      jobName: `at://${actor.did}`,
      data: asDid(actor.did),
    });
  });

  test("招待コードが提供されない場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new InvalidInviteCodeError("Invite code is required"));
  });

  test("すでにサブスクライブ済みの場合、AlreadySubscribedErrorをthrowする", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    await subscriptionFactory(ctx.db)
      .vars({
        actor: () => actor,
        inviteCode: () => inviteCode,
      })
      .create();

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
    const actor = await actorFactory(ctx.db).create();

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
    const actor = await actorFactory(ctx.db).create();
    const expiredInviteCode = await inviteCodeFactory(ctx.db)
      .props({
        expiresAt: () => new Date("2024-12-31T23:59:59.999Z"), // nowより1ミリ秒前
      })
      .create();

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
    const actor = await actorFactory(ctx.db).create();
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({
        expiresAt: () => new Date("2025-01-01T00:00:00.001Z"), // 有効期限は未来
        usedAt: () => new Date("2024-12-31T23:59:59.999Z"), // すでに使用済み
      })
      .create();

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
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({
        expiresAt: () => now,
      })
      .create();

    // act
    await subscribeServerUseCase.execute({
      code: inviteCode.code,
      actorDid: did,
    });

    // assert
    const savedActor = await ctx.db.query.actors.findFirst({
      where: (actors, { eq }) => eq(actors.did, did),
    });
    expect(savedActor).toEqual({
      did,
      handle: null,
      syncRepoStatus: "dirty",
      syncRepoVersion: null,
      indexedAt: now,
    });

    const savedSubscription = await ctx.db.query.subscriptions.findFirst({
      where: (subscriptions, { eq }) => eq(subscriptions.actorDid, did),
    });
    expect(savedSubscription).toEqual({
      actorDid: did,
      inviteCode: inviteCode.code,
      createdAt: now,
    });
  });
});
