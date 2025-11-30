import { asDid } from "@atproto/did";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ProfileRepository } from "./profile-repository.js";

describe("ProfileRepository", () => {
  const { testInjector, ctx } = testSetup;

  const profileRepository = testInjector.injectClass(ProfileRepository);

  describe("findManyDetailed", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await profileRepository.findManyDetailed([]);

      // assert
      expect(result).toEqual([]);
    });

    test("プロフィールが存在しないDIDの場合、空の配列を返す", async () => {
      // arrange
      const did = asDid("did:plc:notfound");

      // act
      const result = await profileRepository.findManyDetailed([did]);

      // assert
      expect(result).toEqual([]);
    });

    test("プロフィールが存在するDIDの場合、プロフィール詳細を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Test User" }))
        .create();

      // act
      const result = await profileRepository.findManyDetailed([
        asDid(actor.did),
      ]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        actorDid: actor.did,
        handle: actor.handle,
        displayName: "Test User",
      });
    });

    test("複数のDIDが指定された場合、それぞれのプロフィール詳細を返す", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "User One" }))
        .create();
      const actor2 = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "User Two" }))
        .create();

      // act
      const result = await profileRepository.findManyDetailed([
        asDid(actor1.did),
        asDid(actor2.did),
      ]);

      // assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            actorDid: actor1.did,
            displayName: "User One",
          }),
          expect.objectContaining({
            actorDid: actor2.did,
            displayName: "User Two",
          }),
        ]),
      );
    });

    test("一部のDIDのみプロフィールが存在する場合、存在するプロフィールのみ返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Existing User" }))
        .create();
      const notFoundDid = asDid("did:plc:notfound");

      // act
      const result = await profileRepository.findManyDetailed([
        asDid(actor.did),
        notFoundDid,
      ]);

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        actorDid: actor.did,
        displayName: "Existing User",
      });
    });

    test("指定された順序でプロフィール詳細を返す", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "User One" }))
        .create();
      const actor2 = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "User Two" }))
        .create();
      const actor3 = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "User Three" }))
        .create();

      // act
      const result = await profileRepository.findManyDetailed([
        asDid(actor3.did),
        asDid(actor1.did),
        asDid(actor2.did),
      ]);

      // assert
      expect(result).toHaveLength(3);
      expect(result[0]?.actorDid).toBe(actor3.did);
      expect(result[1]?.actorDid).toBe(actor1.did);
      expect(result[2]?.actorDid).toBe(actor2.did);
    });
  });

  describe("searchActors", () => {
    test("検索クエリに一致するアクターがない場合、空の配列を返す", async () => {
      // arrange
      await actorFactory(ctx.db)
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
      const actor1 = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice One" }))
        .create();

      const actor2 = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Two" }))
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
      await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice One" }))
        .create();

      // cursorの基準となる時間を待つ
      await new Promise((resolve) => setTimeout(resolve, 10));
      const cursorDate = new Date();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const actor2 = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Alice Two" }))
        .create();

      // act
      const result = await profileRepository.searchActors({
        query: "Alice",
        limit: 10,
        cursor: cursorDate.toISOString(),
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.actorDid).not.toBe(actor2.did);
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
