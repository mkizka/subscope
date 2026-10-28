import { asDid } from "@atproto/did";
import { actorFactory, subscriptionFactory } from "@repo/common/test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("SyncTapRepoUseCase", () => {
  let syncTapRepoUseCase: TestServices["syncTapRepoUseCase"];
  let tapClient: TestServices["tapClient"];
  let subscriptionRepo: TestServices["subscriptionRepository"];
  let followRepo: TestServices["followRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    syncTapRepoUseCase = services.syncTapRepoUseCase;
    tapClient = services.tapClient;
    subscriptionRepo = services.subscriptionRepository;
    followRepo = services.followRepository;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("syncTapRepo-1: サブスクライバーにフォローされているDIDはTapに登録する", async () => {
    // arrange
    const did = asDid(actorFactory().did);
    vi.spyOn(followRepo, "isFollowedByAnySubscriber").mockResolvedValue(true);

    // act
    await syncTapRepoUseCase.execute(did);

    // assert
    expect(tapClient.getRegisteredDids()).toContain(did);
  });

  test("syncTapRepo-2: サブスクライバーはどのサブスクライバーにもフォローされていなくてもTapに登録する", async () => {
    // arrange
    const did = asDid(actorFactory().did);
    subscriptionRepo.add(subscriptionFactory({ actorDid: did }));

    // act
    await syncTapRepoUseCase.execute(did);

    // assert
    expect(tapClient.getRegisteredDids()).toContain(did);
  });

  test("syncTapRepo-3: 追跡アクターでないDIDはTapから削除する", async () => {
    // arrange
    const did = asDid(actorFactory().did);
    await tapClient.addRepo(did);

    // act
    await syncTapRepoUseCase.execute(did);

    // assert
    expect(tapClient.getRegisteredDids()).not.toContain(did);
  });
});
