import { asDid } from "@atproto/did";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ProfileQuery } from "./profile-query.js";

describe("ProfileQuery", () => {
  const { ctx } = testSetup;

  const profileQuery = new ProfileQuery(ctx.db);

  describe("findByDids", () => {
    test("存在しないアクターは含めない", async () => {
      // act
      const result = await profileQuery.findByDids([asDid("did:plc:notfound")]);

      // assert
      expect(result).toEqual([]);
    });

    test("プロフィールのあるアクターは、プロフィールをアクターの情報と一緒に返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Test User" }))
        .create();

      // act
      const result = await profileQuery.findByDids([asDid(actor.did)]);

      // assert
      expect(result).toEqual([
        expect.objectContaining({
          actorDid: actor.did,
          handle: actor.handle,
          displayName: "Test User",
          status: actor.status,
        }),
      ]);
    });

    test("プロフィールのないアクターは、プロフィールの項目を空にしてアクターの取り込み日時で返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await profileQuery.findByDids([asDid(actor.did)]);

      // assert
      expect(result).toEqual([
        {
          actorDid: actor.did,
          handle: actor.handle,
          displayName: null,
          description: null,
          avatarCid: null,
          createdAt: null,
          indexedAt: actor.indexedAt,
          status: actor.status,
        },
      ]);
    });
  });
});
