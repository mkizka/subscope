import { asDid } from "@atproto/did";
import {
  actorFactory,
  followFactory,
  recordFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { beforeEach, describe, expect, test } from "vitest";

import { TrackedActorRepository } from "./tracked-actor-repository.js";

describe("TrackedActorRepository", () => {
  const { ctx, testInjector } = testSetup;
  let repository: TrackedActorRepository;

  beforeEach(async () => {
    repository = testInjector.injectClass(TrackedActorRepository);
    await repository.updateCache();
  });

  describe("updateCache", () => {
    test("DBからサブスクライバーとフォロイーを取得してRedisキャッシュを更新する", async () => {
      // arrange
      const subscriber = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriber })
        .create();

      const followee = await actorFactory(ctx.db).create();
      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ actor: () => subscriber })
              .create(),
          followee: () => followee,
        })
        .create();

      // act
      await repository.updateCache();

      // assert
      expect(await repository.isTrackedActor(asDid(subscriber.did))).toBe(true);
      expect(await repository.isTrackedActor(asDid(followee.did))).toBe(true);
    });

    test("サブスクライバーのみ存在する場合、サブスクライバーのみキャッシュに含まれる", async () => {
      // arrange
      const subscription = await subscriptionFactory(ctx.db).create();

      // act
      await repository.updateCache();

      // assert
      expect(
        await repository.isTrackedActor(asDid(subscription.actorDid)),
      ).toBe(true);
    });

    test("空のDBの場合、空のキャッシュを作成する", async () => {
      // arrange

      // act
      await repository.updateCache();

      // assert
      const nonTrackedActorDid = asDid("did:plc:nontracked123");
      expect(await repository.isTrackedActor(nonTrackedActorDid)).toBe(false);
    });
  });

  describe("isTrackedActor", () => {
    test("サブスクライバーの場合、trueを返す", async () => {
      // arrange
      const subscription = await subscriptionFactory(ctx.db).create();
      await repository.updateCache();

      // act
      const result = await repository.isTrackedActor(
        asDid(subscription.actorDid),
      );

      // assert
      expect(result).toBe(true);
    });

    test("フォロイーの場合、trueを返す", async () => {
      // arrange
      const subscriber = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriber })
        .create();

      const followee = await actorFactory(ctx.db).create();
      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ actor: () => subscriber })
              .create(),
          followee: () => followee,
        })
        .create();
      await repository.updateCache();

      // act
      const result = await repository.isTrackedActor(asDid(followee.did));

      // assert
      expect(result).toBe(true);
    });

    test("追跡アカウントに含まれない場合、falseを返す", async () => {
      // arrange
      const nonTrackedActorDid = asDid("did:plc:nontracked123");

      // act
      const result = await repository.isTrackedActor(nonTrackedActorDid);

      // assert
      expect(result).toBe(false);
    });
  });

  describe("hasTrackedActor", () => {
    test("配列の中に1つでも追跡アカウントが含まれる場合、trueを返す", async () => {
      // arrange
      const subscription = await subscriptionFactory(ctx.db).create();
      await repository.updateCache();

      const nonTrackedActorDid = asDid("did:plc:nontracked123");

      // act
      const result = await repository.hasTrackedActor([
        nonTrackedActorDid,
        asDid(subscription.actorDid),
      ]);

      // assert
      expect(result).toBe(true);
    });

    test("配列の中に追跡アカウントが含まれない場合、falseを返す", async () => {
      // arrange
      const nonTrackedActorDid1 = asDid("did:plc:nontracked123");
      const nonTrackedActorDid2 = asDid("did:plc:nontracked456");

      // act
      const result = await repository.hasTrackedActor([
        nonTrackedActorDid1,
        nonTrackedActorDid2,
      ]);

      // assert
      expect(result).toBe(false);
    });

    test("空配列の場合、falseを返す", async () => {
      // arrange

      // act
      const result = await repository.hasTrackedActor([]);

      // assert
      expect(result).toBe(false);
    });
  });
});
