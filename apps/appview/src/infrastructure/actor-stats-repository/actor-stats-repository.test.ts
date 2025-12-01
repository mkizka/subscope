import { actorStatsFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "./actor-stats-repository.js";

describe("ActorStatsRepository", () => {
  const { testInjector, ctx } = testSetup;

  const actorStatsRepository = testInjector.injectClass(ActorStatsRepository);

  describe("findStats", () => {
    test("空の配列が指定された場合、空のMapを返す", async () => {
      // act
      const result = await actorStatsRepository.findStats([]);

      // assert
      expect(result.size).toBe(0);
    });

    test("統計が存在しないアクターが指定された場合、全て0の統計を返す", async () => {
      // arrange
      const actorDid = "did:plc:notexist123";

      // act
      const result = await actorStatsRepository.findStats([actorDid]);

      // assert
      expect(result.size).toBe(1);
      expect(result.get(actorDid)).toEqual({
        followsCount: 0,
        followersCount: 0,
        postsCount: 0,
      });
    });

    test("統計が存在するアクターが指定された場合、保存された統計を返す", async () => {
      // arrange
      const actorStats = await actorStatsFactory(ctx.db).create();

      // act
      const result = await actorStatsRepository.findStats([
        actorStats.actorDid,
      ]);

      // assert
      expect(result.get(actorStats.actorDid)).toEqual({
        followsCount: actorStats.followsCount,
        followersCount: actorStats.followersCount,
        postsCount: actorStats.postsCount,
      });
    });

    test("複数のアクターが指定された場合、それぞれの統計を含むMapを返す", async () => {
      // arrange
      const [actorStats1, actorStats2] = await actorStatsFactory(
        ctx.db,
      ).createList(2);

      // act
      const result = await actorStatsRepository.findStats([
        actorStats1.actorDid,
        actorStats2.actorDid,
      ]);

      // assert
      expect(result.size).toBe(2);
      expect(result.get(actorStats1.actorDid)).toEqual({
        followsCount: actorStats1.followsCount,
        followersCount: actorStats1.followersCount,
        postsCount: actorStats1.postsCount,
      });
      expect(result.get(actorStats2.actorDid)).toEqual({
        followsCount: actorStats2.followsCount,
        followersCount: actorStats2.followersCount,
        postsCount: actorStats2.postsCount,
      });
    });

    test("統計が存在するアクターと存在しないアクターが混在する場合、それぞれ適切に返す", async () => {
      // arrange
      const actorStats = await actorStatsFactory(ctx.db).create();
      const nonExistentDid = "did:plc:notexist123";

      // act
      const result = await actorStatsRepository.findStats([
        actorStats.actorDid,
        nonExistentDid,
      ]);

      // assert
      expect(result.size).toBe(2);
      expect(result.get(actorStats.actorDid)).toEqual({
        followsCount: actorStats.followsCount,
        followersCount: actorStats.followersCount,
        postsCount: actorStats.postsCount,
      });
      expect(result.get(nonExistentDid)).toEqual({
        followsCount: 0,
        followersCount: 0,
        postsCount: 0,
      });
    });
  });
});
