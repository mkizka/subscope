import {
  actorFactory,
  followFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";
import { UpsertIdentityUseCase } from "./upsert-identity-use-case.js";

describe("UpsertIdentityUseCase", () => {
  const upsertIdentityUseCase = testInjector.injectClass(UpsertIdentityUseCase);

  const actorRepo = testInjector.resolve("actorRepository");
  const subscriptionRepo = testInjector.resolve("subscriptionRepository");
  const followRepo = testInjector.resolve("followRepository");
  const indexTargetRepo = testInjector.resolve("indexTargetRepository");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  test("ハンドルがない場合は何もしない", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:nohandle",
      handle: undefined,
      indexedAt: new Date(),
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const foundActor = await actorRepo.findByDid({ ctx, did: command.did });
    expect(foundActor).toBeNull();
  });

  test("subscriberの場合はactorを保存する", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:identity-subscriber",
      handle: "identity-subscriber.bsky.social",
      indexedAt: new Date(),
    };

    const subscription = subscriptionFactory({
      actorDid: command.did,
    });
    subscriptionRepo.add(subscription);

    await indexTargetRepo.addTrackedActor(command.did);

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const foundActor = await actorRepo.findByDid({ ctx, did: command.did });
    expect(foundActor).not.toBeNull();
    expect(foundActor?.handle).toBe(command.handle);
  });

  test("subscriberでないがsubscriberのフォロワーがいる場合はactorを保存する", async () => {
    // arrange
    const subscriberDid = "did:plc:identity-follower-subscriber";
    const followedDid = "did:plc:identity-followed";
    const command: UpsertIdentityCommand = {
      did: followedDid,
      handle: "identity-followed.bsky.social",
      indexedAt: new Date(),
    };

    const subscriberActor = actorFactory({
      did: subscriberDid,
      handle: "identity-follower-subscriber.bsky.social",
    });
    actorRepo.add(subscriberActor);

    const subscription = subscriptionFactory({
      actorDid: subscriberActor.did,
    });
    subscriptionRepo.add(subscription);

    const follow = followFactory({
      actorDid: subscriberActor.did,
      subjectDid: followedDid,
    });
    followRepo.add(follow);

    await indexTargetRepo.addTrackedActor(followedDid);

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const foundActor = await actorRepo.findByDid({ ctx, did: command.did });
    expect(foundActor).not.toBeNull();
    expect(foundActor?.handle).toBe(command.handle);
  });

  test("subscriberでもなくsubscriberのフォロワーもいない場合はactorを保存しない", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:identity-unrelated",
      handle: "identity-unrelated.bsky.social",
      indexedAt: new Date(),
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const foundActor = await actorRepo.findByDid({ ctx, did: command.did });
    expect(foundActor).toBeNull();
  });
});
