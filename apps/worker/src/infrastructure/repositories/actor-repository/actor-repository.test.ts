import { asDid } from "@atproto/did";
import { Actor } from "@repo/common/domain";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorRepository } from "./actor-repository.js";

describe("ActorRepository", () => {
  const { ctx } = testSetup;
  const actorRepository = new ActorRepository();

  describe("findByDid", () => {
    test("アクターが存在しない場合、nullを返す", async () => {
      // arrange
      const did = asDid("did:plc:xxx");

      // act
      const result = await actorRepository.findByDid({ ctx, did });

      // assert
      expect(result).toBeNull();
    });

    test("アクターが存在する場合、アクターを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await actorRepository.findByDid({
        ctx,
        did: asDid(actor.did),
      });

      // assert
      const expected = Actor.reconstruct({
        did: actor.did,
        handle: actor.handle,
        isAdmin: actor.isAdmin,
        indexedAt: actor.indexedAt,
      });
      expect(result).toEqual(expected);
    });
  });

  describe("upsert", () => {
    test("新規アクターの場合、アクターを挿入する", async () => {
      // arrange
      const did = asDid("did:plc:newactor123");
      const newActor = Actor.reconstruct({
        did: did,
        handle: "newactor.test",
        isAdmin: false,
        indexedAt: new Date(),
      });

      // act
      await actorRepository.upsert({ ctx, actor: newActor });

      // assert
      const result = await actorRepository.findByDid({ ctx, did });
      expect(result).toEqual(newActor);
    });

    test("既存アクターの場合、アクターを更新する", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      const updatedActor = Actor.reconstruct({
        did: actor.did,
        handle: "updated.test",
        isAdmin: false,
        indexedAt: actor.indexedAt,
      });

      // act
      await actorRepository.upsert({ ctx, actor: updatedActor });

      // assert
      const result = await actorRepository.findByDid({
        ctx,
        did: asDid(actor.did),
      });
      expect(result).toEqual(updatedActor);
    });
  });

  describe("exists", () => {
    test("アクターが存在しない場合、falseを返す", async () => {
      // arrange
      const did = asDid("did:plc:notexist");

      // act
      const result = await actorRepository.exists({ ctx, did });

      // assert
      expect(result).toBe(false);
    });

    test("アクターが存在する場合、trueを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await actorRepository.exists({
        ctx,
        did: asDid(actor.did),
      });

      // assert
      expect(result).toBe(true);
    });
  });

  describe("delete", () => {
    test("アクターを削除する", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      await actorRepository.delete({ ctx, did: asDid(actor.did) });

      // assert
      const result = await actorRepository.findByDid({
        ctx,
        did: asDid(actor.did),
      });
      expect(result).toBeNull();
    });
  });
});
