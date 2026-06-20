import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { FollowRepository } from "./follow-repository.js";

describe("FollowRepository", () => {
  const { ctx } = testSetup;

  const followRepository = new FollowRepository();

  describe("findFollowerDids", () => {
    test("subjectをフォローしている人のactorDid一覧を返す", async () => {
      // arrange
      const follower = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => followee,
        })
        .create();

      // act
      const result = await followRepository.findFollowerDids({
        ctx,
        subjectDid: followee.did,
      });

      // assert
      expect(result).toEqual([follower.did]);
    });

    test("誰からもフォローされていない場合、空配列を返す", async () => {
      // arrange
      const followee = await actorFactory(ctx.db).create();

      // act
      const result = await followRepository.findFollowerDids({
        ctx,
        subjectDid: followee.did,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("複数のフォロワーがいる場合、全員のactorDidを返す", async () => {
      // arrange
      const follower1 = await actorFactory(ctx.db).create();
      const follower2 = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower1 })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => followee,
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower2 })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => followee,
        })
        .create();

      // act
      const result = await followRepository.findFollowerDids({
        ctx,
        subjectDid: followee.did,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([follower1.did, follower2.did]),
      );
    });
  });
});
