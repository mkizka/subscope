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
    const ctx = { db: testInjector.resolve("db") };
    const foundActor = await actorRepo.findByDid({ ctx, did: command.did });
    expect(foundActor).toBeNull();
  });

  test("subscriberの場合はactorを保存する", async () => {
    // arrange
    const actor = actorFactory({
      handle: "old-handle.bsky.social",
    });
    actorRepo.add(actor);

    const subscription = subscriptionFactory({ actorDid: actor.did });
    subscriptionRepo.add(subscription);
    await indexTargetRepo.addSubscriber(actor.did);
    await indexTargetRepo.addTrackedActor(actor.did);

    const command: UpsertIdentityCommand = {
      did: actor.did,
      handle: "identity-subscriber.bsky.social",
      indexedAt: new Date(),
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const ctx = { db: testInjector.resolve("db") };
    const foundActor = await actorRepo.findByDid({ ctx, did: command.did });
    expect(foundActor).not.toBeNull();
    expect(foundActor?.handle).toBe(command.handle);
  });

  test("subscriberでないがsubscriberのフォロワーがいる場合はactorを保存する", async () => {
    // arrange
    const subscriberActor = actorFactory();
    actorRepo.add(subscriberActor);

    const subscription = subscriptionFactory({ actorDid: subscriberActor.did });
    subscriptionRepo.add(subscription);
    await indexTargetRepo.addSubscriber(subscriberActor.did);
    await indexTargetRepo.addTrackedActor(subscriberActor.did);

    const followedActor = actorFactory();
    actorRepo.add(followedActor);
    await indexTargetRepo.addTrackedActor(followedActor.did);

    const follow = followFactory({
      actorDid: subscriberActor.did,
      subjectDid: followedActor.did,
    });
    followRepo.add(follow);

    const command: UpsertIdentityCommand = {
      did: followedActor.did,
      handle: "identity-followed.bsky.social",
      indexedAt: new Date(),
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const ctx = { db: testInjector.resolve("db") };
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
    const ctx = { db: testInjector.resolve("db") };
    const foundActor = await actorRepo.findByDid({ ctx, did: command.did });
    expect(foundActor).toBeNull();
  });
});
