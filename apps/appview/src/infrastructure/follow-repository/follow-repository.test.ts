import { asDid } from "@atproto/did";
import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { FollowRepository } from "./follow-repository.js";

describe("FollowRepository", () => {
  const { testInjector, ctx } = testSetup;

  const followRepository = testInjector.injectClass(FollowRepository);

  describe("findFollows", () => {
    test("フォローがない場合、空の配列を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await followRepository.findFollows({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("フォローがある場合、フォロー一覧を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      const follow = await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => followee,
        })
        .create();

      // act
      const result = await followRepository.findFollows({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: follow.uri,
        cid: follow.cid,
        actorDid: actor.did,
        subjectDid: followee.did,
      });
    });

    test("複数のフォローがある場合、sortAtの降順で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const followee1 = await actorFactory(ctx.db).create();
      const followee2 = await actorFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      const follow1 = await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => followee1,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      const follow2 = await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => followee2,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await followRepository.findFollows({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri).toBe(follow2.uri);
      expect(result[1]?.uri).toBe(follow1.uri);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const followee1 = await actorFactory(ctx.db).create();
      const followee2 = await actorFactory(ctx.db).create();
      const followee3 = await actorFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => followee1,
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => followee2,
        })
        .create();

      const record3 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record3,
          followee: () => followee3,
        })
        .create();

      // act
      const result = await followRepository.findFollows({
        actorDid: asDid(actor.did),
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のフォローを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const followee1 = await actorFactory(ctx.db).create();
      const followee2 = await actorFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      const follow1 = await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => followee1,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => followee2,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await followRepository.findFollows({
        actorDid: asDid(actor.did),
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBe(follow1.uri);
    });

    test("他のアクターのフォローは含まれない", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db).create();
      const actor2 = await actorFactory(ctx.db).create();
      const followee = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor2 })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => followee,
        })
        .create();

      // act
      const result = await followRepository.findFollows({
        actorDid: asDid(actor1.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });

  describe("findFollowers", () => {
    test("フォロワーがない場合、空の配列を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await followRepository.findFollowers({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("フォロワーがある場合、フォロワー一覧を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const follower = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower })
        .create();
      const follow = await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => actor,
        })
        .create();

      // act
      const result = await followRepository.findFollowers({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uri: follow.uri,
        cid: follow.cid,
        actorDid: follower.did,
        subjectDid: actor.did,
      });
    });

    test("複数のフォロワーがある場合、sortAtの降順で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const follower1 = await actorFactory(ctx.db).create();
      const follower2 = await actorFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower1 })
        .create();
      const follow1 = await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => actor,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower2 })
        .create();
      const follow2 = await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => actor,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await followRepository.findFollowers({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri).toBe(follow2.uri);
      expect(result[1]?.uri).toBe(follow1.uri);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const followers = await actorFactory(ctx.db).createList(3);

      const records = await Promise.all(
        followers.map((follower) =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => follower })
            .create(),
        ),
      );
      await Promise.all(
        records.map((record) =>
          followFactory(ctx.db)
            .vars({
              record: () => record,
              followee: () => actor,
            })
            .create(),
        ),
      );

      // act
      const result = await followRepository.findFollowers({
        actorDid: asDid(actor.did),
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のフォロワーを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const follower1 = await actorFactory(ctx.db).create();
      const follower2 = await actorFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower1 })
        .create();
      const follow1 = await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => actor,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower2 })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => actor,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await followRepository.findFollowers({
        actorDid: asDid(actor.did),
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBe(follow1.uri);
    });

    test("他のアクターのフォロワーは含まれない", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db).create();
      const actor2 = await actorFactory(ctx.db).create();
      const follower = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => actor2,
        })
        .create();

      // act
      const result = await followRepository.findFollowers({
        actorDid: asDid(actor1.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });

  describe("findFollowingMap", () => {
    test("targetDidsが空の配列の場合、空のMapを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await followRepository.findFollowingMap({
        actorDid: asDid(actor.did),
        targetDids: [],
      });

      // assert
      expect(result.size).toBe(0);
    });

    test("フォローがない場合、空のMapを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const target = await actorFactory(ctx.db).create();

      // act
      const result = await followRepository.findFollowingMap({
        actorDid: asDid(actor.did),
        targetDids: [asDid(target.did)],
      });

      // assert
      expect(result.size).toBe(0);
    });

    test("フォローがある場合、targetDidとフォローURIのMapを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const target = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      const follow = await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => target,
        })
        .create();

      // act
      const result = await followRepository.findFollowingMap({
        actorDid: asDid(actor.did),
        targetDids: [asDid(target.did)],
      });

      // assert
      expect(result.size).toBe(1);
      expect(result.get(asDid(target.did))?.href).toBe(follow.uri);
    });

    test("複数のフォローがある場合、それぞれのフォローURIを含むMapを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const target1 = await actorFactory(ctx.db).create();
      const target2 = await actorFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      const follow1 = await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => target1,
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      const follow2 = await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => target2,
        })
        .create();

      // act
      const result = await followRepository.findFollowingMap({
        actorDid: asDid(actor.did),
        targetDids: [asDid(target1.did), asDid(target2.did)],
      });

      // assert
      expect(result.size).toBe(2);
      expect(result.get(asDid(target1.did))?.href).toBe(follow1.uri);
      expect(result.get(asDid(target2.did))?.href).toBe(follow2.uri);
    });

    test("一部のtargetDidsのみフォローしている場合、フォローしているtargetDidsのみMapに含む", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const target1 = await actorFactory(ctx.db).create();
      const target2 = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      const follow = await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => target1,
        })
        .create();

      // act
      const result = await followRepository.findFollowingMap({
        actorDid: asDid(actor.did),
        targetDids: [asDid(target1.did), asDid(target2.did)],
      });

      // assert
      expect(result.size).toBe(1);
      expect(result.get(asDid(target1.did))?.href).toBe(follow.uri);
      expect(result.has(asDid(target2.did))).toBe(false);
    });
  });

  describe("findFollowedByMap", () => {
    test("targetDidsが空の配列の場合、空のMapを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await followRepository.findFollowedByMap({
        actorDid: asDid(actor.did),
        targetDids: [],
      });

      // assert
      expect(result.size).toBe(0);
    });

    test("フォロワーがない場合、空のMapを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const target = await actorFactory(ctx.db).create();

      // act
      const result = await followRepository.findFollowedByMap({
        actorDid: asDid(actor.did),
        targetDids: [asDid(target.did)],
      });

      // assert
      expect(result.size).toBe(0);
    });

    test("フォロワーがある場合、targetDidとフォローURIのMapを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const target = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => target })
        .create();
      const follow = await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => actor,
        })
        .create();

      // act
      const result = await followRepository.findFollowedByMap({
        actorDid: asDid(actor.did),
        targetDids: [asDid(target.did)],
      });

      // assert
      expect(result.size).toBe(1);
      expect(result.get(asDid(target.did))?.href).toBe(follow.uri);
    });

    test("複数のフォロワーがある場合、それぞれのフォローURIを含むMapを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const target1 = await actorFactory(ctx.db).create();
      const target2 = await actorFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => target1 })
        .create();
      const follow1 = await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => actor,
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => target2 })
        .create();
      const follow2 = await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => actor,
        })
        .create();

      // act
      const result = await followRepository.findFollowedByMap({
        actorDid: asDid(actor.did),
        targetDids: [asDid(target1.did), asDid(target2.did)],
      });

      // assert
      expect(result.size).toBe(2);
      expect(result.get(asDid(target1.did))?.href).toBe(follow1.uri);
      expect(result.get(asDid(target2.did))?.href).toBe(follow2.uri);
    });

    test("一部のtargetDidsのみフォローしている場合、フォローしているtargetDidsのみMapに含む", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const target1 = await actorFactory(ctx.db).create();
      const target2 = await actorFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => target1 })
        .create();
      const follow = await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => actor,
        })
        .create();

      // act
      const result = await followRepository.findFollowedByMap({
        actorDid: asDid(actor.did),
        targetDids: [asDid(target1.did), asDid(target2.did)],
      });

      // assert
      expect(result.size).toBe(1);
      expect(result.get(asDid(target1.did))?.href).toBe(follow.uri);
      expect(result.has(asDid(target2.did))).toBe(false);
    });
  });
});
