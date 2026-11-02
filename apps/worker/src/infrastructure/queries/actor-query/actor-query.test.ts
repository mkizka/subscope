import { asDid } from "@atproto/did";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorQuery } from "./actor-query.js";

describe("ActorQuery", () => {
  const { ctx } = testSetup;
  const actorQuery = new ActorQuery();

  describe("exists", () => {
    test("アクターが存在しない場合、falseを返す", async () => {
      // arrange
      const did = asDid("did:plc:notexist");

      // act
      const result = await actorQuery.exists({ ctx, did });

      // assert
      expect(result).toBe(false);
    });

    test("アクターが存在する場合、trueを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await actorQuery.exists({
        ctx,
        did: asDid(actor.did),
      });

      // assert
      expect(result).toBe(true);
    });
  });
});
