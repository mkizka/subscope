import { asDid } from "@atproto/did";
import {
  accountFactory,
  profileFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ProfileQuery } from "./profile-query.js";

describe("ProfileQuery", () => {
  const { ctx } = testSetup;

  const profileQuery = new ProfileQuery(ctx.db);

  describe("findByDids", () => {
    test("存在しないアカウントは含めない", async () => {
      // act
      const result = await profileQuery.findByDids([asDid("did:plc:notfound")]);

      // assert
      expect(result).toEqual([]);
    });

    test("プロフィールのあるアカウントは、プロフィールをアカウントの情報と一緒に返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Test User" }))
        .create();

      // act
      const result = await profileQuery.findByDids([asDid(account.did)]);

      // assert
      expect(result).toEqual([
        expect.objectContaining({
          accountDid: account.did,
          handle: account.handle,
          displayName: "Test User",
          status: account.status,
        }),
      ]);
    });

    test("プロフィールのないアカウントは、プロフィールの項目を空にしてアカウントの取り込み日時で返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      // act
      const result = await profileQuery.findByDids([asDid(account.did)]);

      // assert
      expect(result).toEqual([
        {
          accountDid: account.did,
          handle: account.handle,
          displayName: null,
          description: null,
          avatarCid: null,
          bannerCid: null,
          createdAt: null,
          indexedAt: account.indexedAt,
          status: account.status,
        },
      ]);
    });
  });

  describe("search", () => {
    test("検索クエリに一致するアカウントがない場合、空の配列を返す", async () => {
      // arrange
      await accountFactory(ctx.db)
        .props({
          handle: () => "alice.test",
        })
        .use((t) => t.withProfile({ displayName: "Alice" }))
        .create();

      // act
      const result = await profileQuery.search({
        query: "Bob",
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("displayNameが検索クエリに一致する場合、そのアカウントを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Smith" }))
        .create();

      // act
      const result = await profileQuery.search({
        query: "Alice",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        accountDid: account.did,
        displayName: "Alice Smith",
      });
    });

    test("handleが検索クエリに一致する場合、そのアカウントを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db)
        .props({
          handle: () => "alice.test",
        })
        .use((t) => t.withProfile({ displayName: "Alice" }))
        .create();

      // act
      const result = await profileQuery.search({
        query: "alice.test",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        accountDid: account.did,
        handle: "alice.test",
      });
    });

    test("検索クエリは大文字小文字を区別しない", async () => {
      // arrange
      const account = await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Smith" }))
        .create();

      // act
      const result = await profileQuery.search({
        query: "ALICE",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        accountDid: account.did,
        displayName: "Alice Smith",
      });
    });

    test("複数のアカウントが一致する場合、indexedAtの降順で返す", async () => {
      // arrange
      const account1 = await accountFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.actor.profile")
        .vars({ account: () => account1 })
        .create();
      await profileFactory(ctx.db)
        .vars({ record: () => record1 })
        .props({
          displayName: () => "Alice One",
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const account2 = await accountFactory(ctx.db).create();
      const record2 = await recordFactory(ctx.db, "app.bsky.actor.profile")
        .vars({ account: () => account2 })
        .create();
      await profileFactory(ctx.db)
        .vars({ record: () => record2 })
        .props({
          displayName: () => "Alice Two",
          indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await profileQuery.search({
        query: "Alice",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.accountDid).toBe(account2.did);
      expect(result[1]?.accountDid).toBe(account1.did);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice One" }))
        .create();
      await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Two" }))
        .create();
      await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Three" }))
        .create();

      // act
      const result = await profileQuery.search({
        query: "Alice",
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のアカウントを返す", async () => {
      // arrange
      const account1 = await accountFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.actor.profile")
        .vars({ account: () => account1 })
        .create();
      await profileFactory(ctx.db)
        .vars({ record: () => record1 })
        .props({
          displayName: () => "Alice One",
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const account2 = await accountFactory(ctx.db).create();
      const record2 = await recordFactory(ctx.db, "app.bsky.actor.profile")
        .vars({ account: () => account2 })
        .create();
      await profileFactory(ctx.db)
        .vars({ record: () => record2 })
        .props({
          displayName: () => "Alice Two",
          indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await profileQuery.search({
        query: "Alice",
        limit: 10,
        cursor: cursorDate,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.accountDid).toBe(account1.did);
    });

    test("検索クエリに含まれるワイルドカード文字はエスケープされる", async () => {
      // arrange
      const account = await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "100% Good" }))
        .create();
      await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "200% Good" }))
        .create();

      // act
      const result = await profileQuery.search({
        query: "100%",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.accountDid).toBe(account.did);
    });

    test("部分一致で検索できる", async () => {
      // arrange
      const account = await accountFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Smith Johnson" }))
        .create();

      // act
      const result = await profileQuery.search({
        query: "Smith",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.accountDid).toBe(account.did);
    });
  });
});
