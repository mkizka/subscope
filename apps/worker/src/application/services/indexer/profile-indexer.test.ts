import { actorFactory, fakeCid, recordFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("ProfileIndexer", () => {
  let sut: TestServices["profileIndexer"];
  let profileRepository: TestServices["profileRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.profileIndexer;
    profileRepository = services.profileRepository;
    db = services.db;
  });

  describe("upsert", () => {
    test("プロフィールレコードを正しく保存する", async () => {
      const ctx = { db };
      // arrange
      const actor = actorFactory();
      const avatarCid = fakeCid();
      const bannerCid = fakeCid();
      const record = recordFactory({
        uri: `at://${actor.did}/app.bsky.actor.profile/self`,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Test User",
          description: "Test description",
          avatar: {
            $type: "blob",
            ref: {
              $link: avatarCid,
            },
            mimeType: "image/jpeg",
            size: 1000,
          },
          banner: {
            $type: "blob",
            ref: {
              $link: bannerCid,
            },
            mimeType: "image/jpeg",
            size: 2000,
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await sut.upsert({ ctx, record });

      // assert
      const profile = profileRepository.findByUri(record.uri);
      expect(profile).toMatchObject({
        uri: record.uri,
        cid: record.cid,
        actorDid: actor.did,
        displayName: "Test User",
        description: "Test description",
        avatarCid,
        bannerCid,
      });
    });
  });
});
