import {
  actorFactory,
  followFactory,
  recordFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { FollowRepository } from "./follow-repository.js";

describe("FollowRepository", () => {
  const { ctx } = testSetup;

  const followRepository = new FollowRepository();

  describe("isFollowedByAnySubscriber", () => {
    test("サブスクライバーからフォローされている場合、trueを返す", async () => {
      // arrange
      const subscriber = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriber })
        .create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => subscriber })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => followee,
        })
        .create();

      // act
      const result = await followRepository.isFollowedByAnySubscriber({
        ctx,
        subjectDid: followee.did,
      });

      // assert
      expect(result).toBe(true);
    });

    test("サブスクライバー以外からのみフォローされている場合、falseを返す", async () => {
      // arrange
      const nonSubscriber = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => nonSubscriber })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => followee,
        })
        .create();

      // act
      const result = await followRepository.isFollowedByAnySubscriber({
        ctx,
        subjectDid: followee.did,
      });

      // assert
      expect(result).toBe(false);
    });

    test("誰からもフォローされていない場合、falseを返す", async () => {
      // arrange
      const followee = await actorFactory(ctx.db).create();

      // act
      const result = await followRepository.isFollowedByAnySubscriber({
        ctx,
        subjectDid: followee.did,
      });

      // assert
      expect(result).toBe(false);
    });

    test("複数のフォロワーがいて、一人がサブスクライバーの場合、trueを返す", async () => {
      // arrange
      const subscriber = await actorFactory(ctx.db).create();
      const nonSubscriber = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriber })
        .create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => subscriber })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => followee,
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => nonSubscriber })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => followee,
        })
        .create();

      // act
      const result = await followRepository.isFollowedByAnySubscriber({
        ctx,
        subjectDid: followee.did,
      });

      // assert
      expect(result).toBe(true);
    });
  });
});
