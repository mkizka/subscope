import { asDid } from "@atproto/did";
import { Actor } from "@repo/common/domain";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorRepository } from "./actor-repository.js";

describe("ActorRepository", () => {
  const { ctx } = testSetup;

  const actorRepository = new ActorRepository(ctx.db);

  describe("find", () => {
    test("アクターが存在しない場合、nullを返す", async () => {
      // arrange
      const did = asDid("did:plc:xxx");

      // act
      const result = await actorRepository.find(did);

      // assert
      expect(result).toBeNull();
    });

    test("アクターが存在する場合、アクターを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await actorRepository.find(asDid(actor.did));

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
      const result = await actorRepository.find(did);
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
      const result = await actorRepository.find(asDid(actor.did));
      expect(result).toEqual(updatedActor);
    });
  });
});
