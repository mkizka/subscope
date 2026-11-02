import { asDid } from "@atproto/did";
import {
  accountFactory,
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
    test("accountDidsとsubjectDidsの両方に当てはまるフォローだけを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const target = await accountFactory(ctx.db).create();
      const other = await accountFactory(ctx.db).create();
      const createFollow = (from: typeof account, to: typeof account) =>
        followFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.graph.follow")
                .vars({ account: () => from })
                .create(),
            followee: () => to,
          })
          .create();
      const follow = await createFollow(account, target);
      await createFollow(account, other);
      await createFollow(target, account);

      // act
      const result = await followQuery.findFollows({
        accountDids: [asDid(account.did)],
        subjectDids: [asDid(target.did)],
      });

      // assert
      expect(result).toEqual([
        {
          uri: follow.uri,
          accountDid: account.did,
          subjectDid: target.did,
        },
      ]);
    });
  });

  describe("findAccountFollows", () => {
    test("フォローがない場合、空の配列を返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      // act
      const result = await followQuery.findAccountFollows({
        accountDid: asDid(account.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("フォローがある場合、フォロー一覧を返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const followee = await accountFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => account })
        .create();
      const follow = await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => followee,
        })
        .create();

      // act
      const result = await followQuery.findAccountFollows({
        accountDid: asDid(account.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([
        { subjectDid: followee.did, sortAt: follow.sortAt },
      ]);
    });

    test("複数のフォローがある場合、sortAtの降順で返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const followee1 = await accountFactory(ctx.db).create();
      const followee2 = await accountFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => account })
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
        .vars({ account: () => account })
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
      const result = await followQuery.findAccountFollows({
        accountDid: asDid(account.did),
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
      const account = await accountFactory(ctx.db).create();
      const followee1 = await accountFactory(ctx.db).create();
      const followee2 = await accountFactory(ctx.db).create();
      const followee3 = await accountFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => account })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => followee1,
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => account })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => followee2,
        })
        .create();

      const record3 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => account })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record3,
          followee: () => followee3,
        })
        .create();

      // act
      const result = await followQuery.findAccountFollows({
        accountDid: asDid(account.did),
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のフォローを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const followee1 = await accountFactory(ctx.db).create();
      const followee2 = await accountFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => account })
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
        .vars({ account: () => account })
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
      const result = await followQuery.findAccountFollows({
        accountDid: asDid(account.did),
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toEqual([
        expect.objectContaining({ subjectDid: followee1.did }),
      ]);
    });

    test("他のアカウントのフォローは含まれない", async () => {
      // arrange
      const account1 = await accountFactory(ctx.db).create();
      const account2 = await accountFactory(ctx.db).create();
      const followee = await accountFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => account2 })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => followee,
        })
        .create();

      // act
      const result = await followQuery.findAccountFollows({
        accountDid: asDid(account1.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });

  describe("findAccountFollowers", () => {
    test("フォロワーがない場合、空の配列を返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      // act
      const result = await followQuery.findAccountFollowers({
        accountDid: asDid(account.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("フォロワーがある場合、フォロワー一覧を返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const follower = await accountFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => follower })
        .create();
      const follow = await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => account,
        })
        .create();

      // act
      const result = await followQuery.findAccountFollowers({
        accountDid: asDid(account.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([
        { accountDid: follower.did, sortAt: follow.sortAt },
      ]);
    });

    test("複数のフォロワーがある場合、sortAtの降順で返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const follower1 = await accountFactory(ctx.db).create();
      const follower2 = await accountFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => follower1 })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => account,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => follower2 })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => account,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await followQuery.findAccountFollowers({
        accountDid: asDid(account.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([
        expect.objectContaining({ accountDid: follower2.did }),
        expect.objectContaining({ accountDid: follower1.did }),
      ]);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const followers = await accountFactory(ctx.db).createList(3);

      const records = await Promise.all(
        followers.map((follower) =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => follower })
            .create(),
        ),
      );
      await Promise.all(
        records.map((record) =>
          followFactory(ctx.db)
            .vars({
              record: () => record,
              followee: () => account,
            })
            .create(),
        ),
      );

      // act
      const result = await followQuery.findAccountFollowers({
        accountDid: asDid(account.did),
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のフォロワーを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const follower1 = await accountFactory(ctx.db).create();
      const follower2 = await accountFactory(ctx.db).create();

      const record1 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => follower1 })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record1,
          followee: () => account,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => follower2 })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record2,
          followee: () => account,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await followQuery.findAccountFollowers({
        accountDid: asDid(account.did),
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toEqual([
        expect.objectContaining({ accountDid: follower1.did }),
      ]);
    });

    test("他のアカウントのフォロワーは含まれない", async () => {
      // arrange
      const account1 = await accountFactory(ctx.db).create();
      const account2 = await accountFactory(ctx.db).create();
      const follower = await accountFactory(ctx.db).create();

      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ account: () => follower })
        .create();
      await followFactory(ctx.db)
        .vars({
          record: () => record,
          followee: () => account2,
        })
        .create();

      // act
      const result = await followQuery.findAccountFollowers({
        accountDid: asDid(account1.did),
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });
});
