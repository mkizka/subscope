import { asDid } from "@atproto/did";
import {
  RedisContainer,
  type StartedRedisContainer,
} from "@testcontainers/redis";
import { Redis } from "ioredis";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { IndexTargetCache } from "./index-target-cache.js";

describe("IndexTargetCache", () => {
  let redisContainer: StartedRedisContainer;
  let redis: Redis;
  let cache: IndexTargetCache;

  beforeEach(async () => {
    redisContainer = await new RedisContainer("redis:7-alpine").start();
    const redisUrl = redisContainer.getConnectionUrl();
    redis = new Redis(redisUrl);
    cache = new IndexTargetCache(redis);
  });

  afterEach(async () => {
    await redis.quit();
    await redisContainer.stop();
  });

  describe("isSubscriber", () => {
    test("サブスクライバーが存在する場合、trueを返す", async () => {
      // arrange
      const did = "did:plc:test123";
      await cache.addSubscriber(did);

      // act
      const result = await cache.isSubscriber(did);

      // assert
      expect(result).toBe(true);
    });

    test("サブスクライバーが存在しない場合、falseを返す", async () => {
      // arrange
      const did = "did:plc:notexist";

      // act
      const result = await cache.isSubscriber(did);

      // assert
      expect(result).toBe(false);
    });
  });

  describe("hasSubscriber", () => {
    test("サブスクライバーが1人でも存在する場合、trueを返す", async () => {
      // arrange
      const did1 = "did:plc:test1";
      const did2 = "did:plc:test2";
      await cache.addSubscriber(did1);

      // act
      const result = await cache.hasSubscriber([did1, did2]);

      // assert
      expect(result).toBe(true);
    });

    test("サブスクライバーが1人も存在しない場合、falseを返す", async () => {
      // arrange
      const dids = ["did:plc:test1", "did:plc:test2"].map(asDid);

      // act
      const result = await cache.hasSubscriber(dids);

      // assert
      expect(result).toBe(false);
    });

    test("空配列の場合、falseを返す", async () => {
      // act
      const result = await cache.hasSubscriber([]);

      // assert
      expect(result).toBe(false);
    });
  });

  describe("isTrackedActor", () => {
    test("追跡アクターが存在する場合、trueを返す", async () => {
      // arrange
      const did = "did:plc:tracked";
      await cache.addTrackedActor(did);

      // act
      const result = await cache.isTrackedActor(did);

      // assert
      expect(result).toBe(true);
    });

    test("追跡アクターが存在しない場合、falseを返す", async () => {
      // arrange
      const did = "did:plc:nottracked";

      // act
      const result = await cache.isTrackedActor(did);

      // assert
      expect(result).toBe(false);
    });
  });

  describe("hasTrackedActor", () => {
    test("追跡アクターが1人でも存在する場合、trueを返す", async () => {
      // arrange
      const did1 = "did:plc:tracked1";
      const did2 = "did:plc:tracked2";
      await cache.addTrackedActor(did1);

      // act
      const result = await cache.hasTrackedActor([did1, did2]);

      // assert
      expect(result).toBe(true);
    });

    test("追跡アクターが1人も存在しない場合、falseを返す", async () => {
      // arrange
      const dids = ["did:plc:tracked1", "did:plc:tracked2"].map(asDid);

      // act
      const result = await cache.hasTrackedActor(dids);

      // assert
      expect(result).toBe(false);
    });

    test("空配列の場合、falseを返す", async () => {
      // act
      const result = await cache.hasTrackedActor([]);

      // assert
      expect(result).toBe(false);
    });
  });

  describe("bulkAddSubscribers", () => {
    test("複数のサブスクライバーを一括追加できる", async () => {
      // arrange
      const dids = ["did:plc:bulk1", "did:plc:bulk2", "did:plc:bulk3"].map(
        asDid,
      );

      // act
      await cache.bulkAddSubscribers(dids);

      // assert
      for (const did of dids) {
        expect(await cache.isSubscriber(did)).toBe(true);
      }
    });

    test("空配列の場合、何もしない", async () => {
      // act & assert
      await expect(cache.bulkAddSubscribers([])).resolves.toBeUndefined();
    });
  });

  describe("bulkAddTrackedActors", () => {
    test("複数の追跡アクターを一括追加できる", async () => {
      // arrange
      const dids = ["did:plc:bulk1", "did:plc:bulk2", "did:plc:bulk3"].map(
        asDid,
      );

      // act
      await cache.bulkAddTrackedActors(dids);

      // assert
      for (const did of dids) {
        expect(await cache.isTrackedActor(did)).toBe(true);
      }
    });

    test("空配列の場合、何もしない", async () => {
      // act & assert
      await expect(cache.bulkAddTrackedActors([])).resolves.toBeUndefined();
    });
  });

  describe("removeSubscriber", () => {
    test("サブスクライバーを削除できる", async () => {
      // arrange
      const did = "did:plc:remove";
      await cache.addSubscriber(did);

      // act
      await cache.removeSubscriber(did);

      // assert
      expect(await cache.isSubscriber(did)).toBe(false);
    });
  });

  describe("removeTrackedActor", () => {
    test("追跡アクターを削除できる", async () => {
      // arrange
      const did = "did:plc:remove";
      await cache.addTrackedActor(did);

      // act
      await cache.removeTrackedActor(did);

      // assert
      expect(await cache.isTrackedActor(did)).toBe(false);
    });
  });

  describe("clear", () => {
    test("全てのキャッシュをクリアできる", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber";
      const trackedActorDid = "did:plc:tracked";
      await cache.addSubscriber(subscriberDid);
      await cache.addTrackedActor(trackedActorDid);

      // act
      await cache.clear();

      // assert
      expect(await cache.isSubscriber(subscriberDid)).toBe(false);
      expect(await cache.isTrackedActor(trackedActorDid)).toBe(false);
    });
  });
});
