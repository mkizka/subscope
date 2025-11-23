import { asDid } from "@atproto/did";
import { subscriptionFactory, testSetup } from "@repo/test-utils";
import { beforeEach, describe, expect, test } from "vitest";

import { SubscriberRepository } from "./subscriber-repository.js";

describe("SubscriberRepository", () => {
  const { ctx, testInjector } = testSetup;
  let repository: SubscriberRepository;

  beforeEach(async () => {
    repository = testInjector.injectClass(SubscriberRepository);
    await repository.updateCache();
  });

  describe("updateCache", () => {
    test("DBからサブスクライバーを取得してRedisキャッシュを更新する", async () => {
      // arrange
      const [subscription1, subscription2] = await subscriptionFactory(
        ctx.db,
      ).createList(2);

      // act
      await repository.updateCache();

      // assert
      expect(await repository.isSubscriber(asDid(subscription1.actorDid))).toBe(
        true,
      );
      expect(await repository.isSubscriber(asDid(subscription2.actorDid))).toBe(
        true,
      );
    });

    test("空のDBの場合、空のキャッシュを作成する", async () => {
      // arrange

      // act
      await repository.updateCache();

      // assert
      const nonSubscriberDid = asDid("did:plc:nonsubscriber123");
      expect(await repository.isSubscriber(nonSubscriberDid)).toBe(false);
    });
  });

  describe("isSubscriber", () => {
    test("サブスクライバーに含まれる場合、trueを返す", async () => {
      // arrange
      const subscription = await subscriptionFactory(ctx.db).create();
      await repository.updateCache();

      // act
      const result = await repository.isSubscriber(
        asDid(subscription.actorDid),
      );

      // assert
      expect(result).toBe(true);
    });

    test("サブスクライバーに含まれない場合、falseを返す", async () => {
      // arrange
      const nonSubscriberDid = asDid("did:plc:nonsubscriber123");

      // act
      const result = await repository.isSubscriber(nonSubscriberDid);

      // assert
      expect(result).toBe(false);
    });
  });

  describe("hasSubscriber", () => {
    test("配列の中に1つでもサブスクライバーが含まれる場合、trueを返す", async () => {
      // arrange
      const subscription = await subscriptionFactory(ctx.db).create();
      await repository.updateCache();

      const nonSubscriberDid = asDid("did:plc:nonsubscriber123");

      // act
      const result = await repository.hasSubscriber([
        nonSubscriberDid,
        asDid(subscription.actorDid),
      ]);

      // assert
      expect(result).toBe(true);
    });

    test("配列の中にサブスクライバーが含まれない場合、falseを返す", async () => {
      // arrange
      const nonSubscriberDid1 = asDid("did:plc:nonsubscriber123");
      const nonSubscriberDid2 = asDid("did:plc:nonsubscriber456");

      // act
      const result = await repository.hasSubscriber([
        nonSubscriberDid1,
        nonSubscriberDid2,
      ]);

      // assert
      expect(result).toBe(false);
    });

    test("空配列の場合、falseを返す", async () => {
      // arrange

      // act
      const result = await repository.hasSubscriber([]);

      // assert
      expect(result).toBe(false);
    });
  });
});
