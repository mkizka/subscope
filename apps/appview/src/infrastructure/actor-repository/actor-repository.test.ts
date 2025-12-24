import { asDid } from "@atproto/did";
import { Actor } from "@repo/common/domain";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorRepository } from "./actor-repository.js";

describe("ActorRepository", () => {
  const { testInjector, ctx } = testSetup;

  const actorRepository = testInjector.injectClass(ActorRepository);

  describe("findByDid", () => {
    test("アクターが存在しない場合、nullを返す", async () => {
      // arrange
      const did = asDid("did:plc:xxx");

      // act
      const result = await actorRepository.findByDid(did);

      // assert
      expect(result).toBeNull();
    });

    test("アクターが存在する場合、アクターを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      // act
      const result = await actorRepository.findByDid(asDid(actor.did));

      // assert
      expect(result).toMatchObject({
        did: actor.did,
        handle: actor.handle,
      });
    });
  });

  describe("upsert", () => {
    test("新規アクターの場合、アクターを挿入する", async () => {
      // arrange
      const did = asDid("did:plc:newactor123");
      const newActor = Actor.reconstruct({
        did: did,
        handle: "newactor.test",
        indexedAt: new Date(),
      });

      // act
      await actorRepository.upsert({ ctx, actor: newActor });

      // assert
      const result = await actorRepository.findByDid(did);
      expect(result).toMatchObject({
        did: newActor.did,
        handle: newActor.handle,
      });
    });

    test("既存アクターの場合、アクターを更新する", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

      const updatedActor = Actor.reconstruct({
        did: actor.did,
        handle: "updated.test",
        indexedAt: new Date(),
      });

      // act
      await actorRepository.upsert({ ctx, actor: updatedActor });

      // assert
      const result = await actorRepository.findByDid(asDid(actor.did));
      expect(result).toMatchObject({
        did: updatedActor.did,
        handle: updatedActor.handle,
      });
    });
  });
});
