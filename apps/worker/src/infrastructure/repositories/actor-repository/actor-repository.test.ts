import { asDid } from "@atproto/did";
import { Actor } from "@repo/common/domain";
import { schema } from "@repo/db";
import { actorFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { ActorRepository } from "./actor-repository.js";

describe("ActorRepository", () => {
  const { ctx } = testSetup;
  const actorRepository = new ActorRepository();

  describe("find", () => {
    test("アクターが存在しない場合、nullを返す", async () => {
      // arrange
      const did = asDid("did:plc:xxx");

      // act
      const result = await actorRepository.find({ ctx, did });

      // assert
      expect(result).toBeNull();
    });

    test("アクターが存在する場合、アクターを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await actorRepository.find({
        ctx,
        did: asDid(actor.did),
      });

      // assert
      const expected = Actor.reconstruct({
        did: actor.did,
        handle: actor.handle,
        isAdmin: actor.isAdmin,
        isBanned: actor.isBanned,
        indexedAt: actor.indexedAt,
      });
      expect(result).toEqual(expected);
    });
  });

  describe("save", () => {
    test("新規アクターの場合、アクターを挿入する", async () => {
      // arrange
      const did = asDid("did:plc:newactor123");
      const newActor = Actor.reconstruct({
        did: did,
        handle: "newactor.test",
        isAdmin: false,
        isBanned: false,
        indexedAt: new Date(),
      });

      // act
      await actorRepository.save({ ctx, actor: newActor });

      // assert
      const result = await actorRepository.find({ ctx, did });
      expect(result).toEqual(newActor);
    });

    test("既存アクターの場合、アクターを更新する", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      const updatedActor = Actor.reconstruct({
        did: actor.did,
        handle: "updated.test",
        isAdmin: false,
        isBanned: false,
        indexedAt: actor.indexedAt,
      });

      // act
      await actorRepository.save({ ctx, actor: updatedActor });

      // assert
      const result = await actorRepository.find({
        ctx,
        did: asDid(actor.did),
      });
      expect(result).toEqual(updatedActor);
    });
  });

  test("index-13: アクターを保存するときは、管理者権限を書き換えない", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const staleActor = Actor.reconstruct({
      did: actor.did,
      handle: "updated.test",
      isAdmin: false,
      isBanned: false,
      indexedAt: actor.indexedAt,
    });
    await ctx.db
      .update(schema.actors)
      .set({ isAdmin: true })
      .where(eq(schema.actors.did, actor.did));

    // act
    await actorRepository.save({ ctx, actor: staleActor });

    // assert
    const result = await actorRepository.find({
      ctx,
      did: asDid(actor.did),
    });
    expect(result?.isAdmin).toBe(true);
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
      const result = await actorRepository.find({
        ctx,
        did: asDid(actor.did),
      });
      expect(result).toBeNull();
    });
  });
});
