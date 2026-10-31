import { asDid } from "@atproto/did";
import { actorFactory, profileDetailedFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("ProfileViewService", () => {
  let profileViewService: TestServices["profileViewService"];
  let profileRepo: TestServices["profileRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    profileViewService = services.profileViewService;
    profileRepo = services.profileRepository;
  });

  describe("findProfileViewBasic", () => {
    test("プロフィールが存在する場合、ProfileViewBasicを返す", async () => {
      // arrange
      const actor = actorFactory();
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        handle: actor.handle,
        displayName: "Test User",
      });
      profileRepo.add(profile);

      // act
      const results = await profileViewService.findProfileViewBasic([
        asDid(actor.did),
      ]);

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        $type: "app.bsky.actor.defs#profileViewBasic",
        did: actor.did,
        handle: actor.handle,
        displayName: "Test User",
      });
    });

    test("プロフィールが存在しない場合、空の配列を返す", async () => {
      // arrange
      const nonExistentDid = "did:plc:nonexistent";

      // act
      const results = await profileViewService.findProfileViewBasic([
        nonExistentDid,
      ]);

      // assert
      expect(results).toEqual([]);
    });
  });
});
