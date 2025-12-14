import { asDid } from "@atproto/did";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { WarmUpIndexTargetCacheUseCase } from "./warm-up-index-target-cache-use-case.js";

describe("WarmUpIndexTargetCacheUseCase", () => {
  const warmUpUseCase = testInjector.injectClass(WarmUpIndexTargetCacheUseCase);

  const indexTargetRepository = testInjector.resolve(
    "indexTargetDataRepository",
  );
  const indexTargetCache = testInjector.resolve("indexTargetCache");

  test("サブスクライバーが存在しない場合、キャッシュをクリアする", async () => {
    // arrange
    await indexTargetCache.addSubscriber(asDid("did:plc:test1"));
    await indexTargetCache.addTrackedActor(asDid("did:plc:test2"));

    // act
    await warmUpUseCase.execute();

    // assert
    expect(await indexTargetCache.isSubscriber(asDid("did:plc:test1"))).toBe(
      false,
    );
    expect(await indexTargetCache.isTrackedActor(asDid("did:plc:test2"))).toBe(
      false,
    );
  });

  test("サブスクライバーが存在する場合、サブスクライバーをキャッシュに追加する", async () => {
    // arrange
    const subscriberDid = asDid("did:plc:subscriber1");
    indexTargetRepository.addSubscriber(subscriberDid);

    // act
    await warmUpUseCase.execute();

    // assert
    expect(await indexTargetCache.isSubscriber(subscriberDid)).toBe(true);
    expect(await indexTargetCache.isTrackedActor(subscriberDid)).toBe(true);
  });

  test("サブスクライバーがフォローしているアクターも追跡対象として追加する", async () => {
    // arrange
    const subscriberDid = asDid("did:plc:subscriber1");
    const followeeDid1 = asDid("did:plc:followee1");
    const followeeDid2 = asDid("did:plc:followee2");

    indexTargetRepository.addSubscriber(subscriberDid);
    indexTargetRepository.addFollow({
      uri: "at://did:plc:subscriber1/app.bsky.graph.follow/follow1",
      actorDid: subscriberDid,
      subjectDid: followeeDid1,
    });
    indexTargetRepository.addFollow({
      uri: "at://did:plc:subscriber1/app.bsky.graph.follow/follow2",
      actorDid: subscriberDid,
      subjectDid: followeeDid2,
    });

    // act
    await warmUpUseCase.execute();

    // assert
    expect(await indexTargetCache.isSubscriber(subscriberDid)).toBe(true);
    expect(await indexTargetCache.isTrackedActor(subscriberDid)).toBe(true);
    expect(await indexTargetCache.isTrackedActor(followeeDid1)).toBe(true);
    expect(await indexTargetCache.isTrackedActor(followeeDid2)).toBe(true);
  });

  test("複数のサブスクライバーとそのフォロイーをまとめてキャッシュに追加する", async () => {
    // arrange
    const subscriber1Did = asDid("did:plc:subscriber1");
    const subscriber2Did = asDid("did:plc:subscriber2");
    const followee1Did = asDid("did:plc:followee1");
    const followee2Did = asDid("did:plc:followee2");

    indexTargetRepository.addSubscriber(subscriber1Did);
    indexTargetRepository.addSubscriber(subscriber2Did);
    indexTargetRepository.addFollow({
      uri: "at://did:plc:subscriber1/app.bsky.graph.follow/follow1",
      actorDid: subscriber1Did,
      subjectDid: followee1Did,
    });
    indexTargetRepository.addFollow({
      uri: "at://did:plc:subscriber2/app.bsky.graph.follow/follow2",
      actorDid: subscriber2Did,
      subjectDid: followee2Did,
    });

    // act
    await warmUpUseCase.execute();

    // assert
    expect(await indexTargetCache.isSubscriber(subscriber1Did)).toBe(true);
    expect(await indexTargetCache.isSubscriber(subscriber2Did)).toBe(true);
    expect(await indexTargetCache.isTrackedActor(subscriber1Did)).toBe(true);
    expect(await indexTargetCache.isTrackedActor(subscriber2Did)).toBe(true);
    expect(await indexTargetCache.isTrackedActor(followee1Did)).toBe(true);
    expect(await indexTargetCache.isTrackedActor(followee2Did)).toBe(true);
  });
});
