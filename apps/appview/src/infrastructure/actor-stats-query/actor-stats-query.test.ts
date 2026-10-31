import { asDid } from "@atproto/did";
import { actorStatsFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsQuery } from "./actor-stats-query.js";

describe("ActorStatsQuery", () => {
  const { ctx } = testSetup;

  const actorStatsQuery = new ActorStatsQuery(ctx.db);

  describe("findStats", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await actorStatsQuery.findStats([]);

      // assert
      expect(result).toEqual([]);
    });

    test("統計が存在するアクターの統計だけを返す", async () => {
      // arrange
      const actorStats = await actorStatsFactory(ctx.db).create();

      // act
      const result = await actorStatsQuery.findStats([
        asDid(actorStats.actorDid),
        asDid("did:plc:notexist123"),
      ]);

      // assert
      expect(result).toEqual([
        {
          actorDid: actorStats.actorDid,
          followsCount: actorStats.followsCount,
          followersCount: actorStats.followersCount,
          postsCount: actorStats.postsCount,
        },
      ]);
    });
  });
});
