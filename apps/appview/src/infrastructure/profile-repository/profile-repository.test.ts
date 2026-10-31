import {
  actorFactory,
  profileFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ProfileRepository } from "./profile-repository.js";

describe("ProfileRepository", () => {
  const { ctx } = testSetup;

  const profileRepository = new ProfileRepository(ctx.db);

  describe("searchActors", () => {
    test("検索クエリに一致するアクターがない場合、空の配列を返す", async () => {
      // arrange
      await actorFactory(ctx.db)
        .props({
          handle: () => "alice.test",
        })
        .use((t) => t.withProfile({ displayName: "Alice" }))
        .create();

      // act
      const result = await profileRepository.searchActors({
        query: "Bob",
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("displayNameが検索クエリに一致する場合、そのアクターを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Smith" }))
        .create();

      // act
      const result = await profileRepository.searchActors({
        query: "Alice",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        actorDid: actor.did,
        displayName: "Alice Smith",
      });
    });

    test("handleが検索クエリに一致する場合、そのアクターを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .props({
          handle: () => "alice.test",
        })
        .use((t) => t.withProfile({ displayName: "Alice" }))
        .create();

      // act
      const result = await profileRepository.searchActors({
        query: "alice.test",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        actorDid: actor.did,
        handle: "alice.test",
      });
    });

    test("検索クエリは大文字小文字を区別しない", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Smith" }))
        .create();

      // act
      const result = await profileRepository.searchActors({
        query: "ALICE",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        actorDid: actor.did,
        displayName: "Alice Smith",
      });
    });

    test("複数のアクターが一致する場合、indexedAtの降順で返す", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.actor.profile")
        .vars({ actor: () => actor1 })
        .create();
      await profileFactory(ctx.db)
        .vars({ record: () => record1 })
        .props({
          displayName: () => "Alice One",
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const actor2 = await actorFactory(ctx.db).create();
      const record2 = await recordFactory(ctx.db, "app.bsky.actor.profile")
        .vars({ actor: () => actor2 })
        .create();
      await profileFactory(ctx.db)
        .vars({ record: () => record2 })
        .props({
          displayName: () => "Alice Two",
          indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await profileRepository.searchActors({
        query: "Alice",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.actorDid).toBe(actor2.did);
      expect(result[1]?.actorDid).toBe(actor1.did);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice One" }))
        .create();
      await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Two" }))
        .create();
      await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Three" }))
        .create();

      // act
      const result = await profileRepository.searchActors({
        query: "Alice",
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のアクターを返す", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.actor.profile")
        .vars({ actor: () => actor1 })
        .create();
      await profileFactory(ctx.db)
        .vars({ record: () => record1 })
        .props({
          displayName: () => "Alice One",
          indexedAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const actor2 = await actorFactory(ctx.db).create();
      const record2 = await recordFactory(ctx.db, "app.bsky.actor.profile")
        .vars({ actor: () => actor2 })
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
      const result = await profileRepository.searchActors({
        query: "Alice",
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.actorDid).toBe(actor1.did);
    });

    test("検索クエリに含まれるワイルドカード文字はエスケープされる", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "100% Good" }))
        .create();
      await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "200% Good" }))
        .create();

      // act
      const result = await profileRepository.searchActors({
        query: "100%",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.actorDid).toBe(actor.did);
    });

    test("部分一致で検索できる", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Smith Johnson" }))
        .create();

      // act
      const result = await profileRepository.searchActors({
        query: "Smith",
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.actorDid).toBe(actor.did);
    });
  });
});
