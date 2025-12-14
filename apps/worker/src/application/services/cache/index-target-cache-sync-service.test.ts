import { asDid } from "@atproto/did";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { IndexTargetCacheSyncService } from "./index-target-cache-sync-service.js";

describe("IndexTargetCacheSyncService", () => {
  const syncService = testInjector.injectClass(IndexTargetCacheSyncService);

  const indexTargetRepository = testInjector.resolve(
    "indexTargetDataRepository",
  );
  const indexTargetCache = testInjector.resolve("indexTargetCache");

  test("フォロワーが見つからない場合、何もしない", async () => {
    // arrange
    const followUri = "at://did:plc:unknown/app.bsky.graph.follow/follow1";

    // act
    await syncService.syncFollowCreate(followUri);

    // assert
    expect(
      await indexTargetCache.isTrackedActor(asDid("did:plc:unknown")),
    ).toBe(false);
  });

  test("フォロワーがサブスクライバーでない場合、何もしない", async () => {
    // arrange
    const followerDid = asDid("did:plc:follower");
    const followeeDid = asDid("did:plc:followee");
    const followUri = "at://did:plc:follower/app.bsky.graph.follow/follow1";

    indexTargetRepository.addFollow({
      uri: followUri,
      actorDid: followerDid,
      subjectDid: followeeDid,
    });

    // act
    await syncService.syncFollowCreate(followUri);

    // assert
    expect(await indexTargetCache.isTrackedActor(followeeDid)).toBe(false);
  });

  test("フォロワーがサブスクライバーの場合、フォロイーを追跡対象に追加する", async () => {
    // arrange
    const subscriberDid = asDid("did:plc:subscriber");
    const followeeDid = asDid("did:plc:followee");
    const followUri = "at://did:plc:subscriber/app.bsky.graph.follow/follow1";

    await indexTargetCache.addSubscriber(subscriberDid);
    indexTargetRepository.addFollow({
      uri: followUri,
      actorDid: subscriberDid,
      subjectDid: followeeDid,
    });

    // act
    await syncService.syncFollowCreate(followUri);

    // assert
    expect(await indexTargetCache.isTrackedActor(followeeDid)).toBe(true);
  });

  test("フォロイーが見つからない場合、何もしない", async () => {
    // arrange
    const subscriberDid = asDid("did:plc:subscriber");
    const followUri = "at://did:plc:subscriber/app.bsky.graph.follow/follow1";

    await indexTargetCache.addSubscriber(subscriberDid);

    // act
    await syncService.syncFollowCreate(followUri);

    // assert
    const trackedActors = await indexTargetCache.isTrackedActor(
      asDid("did:plc:unknown"),
    );
    expect(trackedActors).toBe(false);
  });
});
