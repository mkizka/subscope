import { fakeCid } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../../domain/account.factory.js";
import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import { recordFactory } from "../../dto/record.factory.js";

describe("ProfileIndexer", () => {
  let profileIndexer: TestServices["profileIndexer"];
  let profileRepo: TestServices["profileRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    profileIndexer = services.profileIndexer;
    profileRepo = services.profileRepository;
    db = services.db;
  });

  describe("upsert", () => {
    test("プロフィールレコードを正しく保存する", async () => {
      const ctx = { db };
      // arrange
      const account = accountFactory();
      const avatarCid = fakeCid();
      const bannerCid = fakeCid();
      const record = recordFactory({
        uri: `at://${account.did}/app.bsky.actor.profile/self`,
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
      const profile = await profileRepo.find({ ctx, uri: record.uri });
      expect(profile).toMatchObject({
        uri: record.uri.toString(),
        cid: record.cid,
        accountDid: account.did,
        displayName: "Test User",
        description: "Test description",
        avatarCid,
        bannerCid,
      });
    });
  });
});
