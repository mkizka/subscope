import { actorFactory, fakeCid, recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { ProfileIndexer } from "./profile-indexer.js";

describe("ProfileIndexer", () => {
  const profileIndexer = testInjector.injectClass(ProfileIndexer);

  const profileRepo = testInjector.resolve("profileRepository");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  describe("upsert", () => {
    test("プロフィールレコードを正しく保存する", async () => {
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
      await profileIndexer.upsert({ ctx, record });

      // assert
      const profile = profileRepo.findByUri(record.uri);
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
