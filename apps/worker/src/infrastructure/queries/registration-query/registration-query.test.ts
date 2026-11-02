import {
  actorFactory,
  followFactory,
  recordFactory,
  registrationFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { RegistrationQuery } from "./registration-query.js";

describe("RegistrationQuery", () => {
  const { ctx } = testSetup;

  const registrationQuery = new RegistrationQuery();

  describe("isFollowedByAnyRegisteredAccount", () => {
    test("サブスクライバーからフォローされている場合、trueを返す", async () => {
      // arrange
      const registeredAccount = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      await registrationFactory(ctx.db)
        .vars({ actor: () => registeredAccount })
        .create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => registeredAccount })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => followee,
        })
        .create();

      // act
      const result = await registrationQuery.isFollowedByAnyRegisteredAccount(
        ctx,
        followee.did,
      );

      // assert
      expect(result).toBe(true);
    });

    test("サブスクライバー以外からのみフォローされている場合、falseを返す", async () => {
      // arrange
      const nonRegisteredAccount = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => nonRegisteredAccount })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => followee,
        })
        .create();

      // act
      const result = await registrationQuery.isFollowedByAnyRegisteredAccount(
        ctx,
        followee.did,
      );

      // assert
      expect(result).toBe(false);
    });

    test("誰からもフォローされていない場合、falseを返す", async () => {
      // arrange
      const followee = await actorFactory(ctx.db).create();

      // act
      const result = await registrationQuery.isFollowedByAnyRegisteredAccount(
        ctx,
        followee.did,
      );

      // assert
      expect(result).toBe(false);
    });

    test("複数のフォロワーがいて、一人がサブスクライバーの場合、trueを返す", async () => {
      // arrange
      const registeredAccount = await actorFactory(ctx.db).create();
      const nonRegisteredAccount = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      await registrationFactory(ctx.db)
        .vars({ actor: () => registeredAccount })
        .create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => registeredAccount })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => followee,
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => nonRegisteredAccount })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => followee,
        })
        .create();

      // act
      const result = await registrationQuery.isFollowedByAnyRegisteredAccount(
        ctx,
        followee.did,
      );

      // assert
      expect(result).toBe(true);
    });
  });
});
