import { asDid } from "@atproto/did";
import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { FollowQuery } from "./follow-query.js";

describe("FollowQuery", () => {
  const { ctx } = testSetup;

  const followQuery = new FollowQuery(ctx.db);

  describe("findFollows", () => {
    test("actorDidsとsubjectDidsの両方に当てはまるフォローだけを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const target = await actorFactory(ctx.db).create();
      const other = await actorFactory(ctx.db).create();
      const createFollow = (from: typeof actor, to: typeof actor) =>
        followFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.graph.follow")
                .vars({ actor: () => from })
                .create(),
            followee: () => to,
          })
          .create();
      const follow = await createFollow(actor, target);
      await createFollow(actor, other);
      await createFollow(target, actor);

      // act
      const result = await followQuery.findFollows({
        actorDids: [asDid(actor.did)],
        subjectDids: [asDid(target.did)],
      });

      // assert
      expect(result).toEqual([
        {
          uri: follow.uri,
          actorDid: actor.did,
          subjectDid: target.did,
        },
      ]);
    });
  });

  describe("findActorFollows", () => {
    test("フォローがない場合、空の配列を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await followQuery.findActorFollows({
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
      const result = await followQuery.findActorFollows({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([
        { subjectDid: followee.did, sortAt: follow.sortAt },
      ]);
    });

    test("複数のフォローがある場合、sortAtの降順で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const followee1 = await actorFactory(ctx.db).create();
      const followee2 = await actorFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => actor })
        .create();
      await followFactory(ctx.db)
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

      // act
      const result = await followQuery.findActorFollows({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([
        expect.objectContaining({ subjectDid: followee2.did }),
        expect.objectContaining({ subjectDid: followee1.did }),
      ]);
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
      const result = await followQuery.findActorFollows({
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
      await followFactory(ctx.db)
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
      const result = await followQuery.findActorFollows({
        actorDid: asDid(actor.did),
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toEqual([
        expect.objectContaining({ subjectDid: followee1.did }),
      ]);
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
      const result = await followQuery.findActorFollows({
        actorDid: asDid(actor1.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });

  describe("findActorFollowers", () => {
    test("フォロワーがない場合、空の配列を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await followQuery.findActorFollowers({
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
      const result = await followQuery.findActorFollowers({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([
        { actorDid: follower.did, sortAt: follow.sortAt },
      ]);
    });

    test("複数のフォロワーがある場合、sortAtの降順で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const follower1 = await actorFactory(ctx.db).create();
      const follower2 = await actorFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => follower1 })
        .create();
      await followFactory(ctx.db)
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

      // act
      const result = await followQuery.findActorFollowers({
        actorDid: asDid(actor.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([
        expect.objectContaining({ actorDid: follower2.did }),
        expect.objectContaining({ actorDid: follower1.did }),
      ]);
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
      const result = await followQuery.findActorFollowers({
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
      await followFactory(ctx.db)
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
      const result = await followQuery.findActorFollowers({
        actorDid: asDid(actor.did),
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toEqual([
        expect.objectContaining({ actorDid: follower1.did }),
      ]);
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
      const result = await followQuery.findActorFollowers({
        actorDid: asDid(actor1.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });
});
